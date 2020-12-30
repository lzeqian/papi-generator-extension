/**
 * 注入js
 * */
function injectCustomJs(jsPath, callback) {
    var temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    temp.src = chrome.extension.getURL(jsPath);// 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    temp.onload = function () {
        callback && callback();
    }
    document.head.appendChild(temp);
}

/**
 * 注入css
 * */
function injectCustomCss(cssPath) {
    var temp = document.createElement('link');
    temp.setAttribute('rel', 'stylesheet');
    temp.setAttribute('href', chrome.extension.getURL(cssPath));
    document.head.appendChild(temp);
}

function InjectButton(buttonId, buttonText, offsetSelector, filterSelectNodeFun, appendCallbackFun) {
    this.buttonId = buttonId;
    this.buttonText = buttonText;
    this.offsetSelector = offsetSelector;
    this.filterSelectNodeFun = filterSelectNodeFun;
    this.appendCallbackFun = appendCallbackFun;
    this.inject = function () {
        let _this=this;

        //找到相对元素的位置
        let offsetNode = null;
        $(_this.offsetSelector).each(function (i, ele) {
            if(_this.buttonId=="interfacePageButton"){
                // debugger
            }
            if (!offsetNode) {
                offsetNode = _this.filterSelectNodeFun(ele)
            }
        });
        let currentJqueryNode = $("#" + buttonId)
        if (offsetNode && currentJqueryNode.length == 0) {
            _this.appendCallbackFun(buttonId, buttonText,offsetNode)
        }
    };
}

/**
 *   content-scripts和原始页面共享DOM，但是不共享JS，如要访问页面JS（例如某个JS变量），只能通过injected js来实现。content-scripts不能访问绝大部分chrome.xxx.api，除了下面这4种：
 chrome.extension(getURL , inIncognitoContext , lastError , onRequest , sendRequest)
 chrome.i18n
 chrome.runtime(connect , getManifest , getURL , id , onConnect , onMessage , sendMessage)
 chrome.storage
 */
$(function () {
    //注入content-inject.js ,注意需在manifest.json配置 "web_accessible_resources": ["js/inject.js"], 否则加载失败
    injectCustomJs('js/common.js',function(){
        injectCustomJs('js/inject.js')
        injectCustomJs('external/jquery-1.11.0.min.js', function () {
            injectCustomJs('external/jquery-ui.min.js')
            injectCustomCss('external/jquery-ui.min.css')
        })
    })
    //接口页面生成代码按钮
    let interfaceGeneratorCodeButton = new InjectButton("interfaceGeneratorCodeButton", "生成代码", ".ant-tabs-tab",
        (ele) => {
            return ele.innerText == "高级Mock" ? ele : null
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).parent().append('<button id="'+buiId+'" type="button" onclick="generatorInterfaceCode(0)" class="ant-btn btn-filter ant-btn-primary generatorCodeBtn"><span>'+bText+'</span></button>')
        }
    )
    //分类页面生成代码按钮
    let catGeneratorCodeButton = new InjectButton("catGeneratorCodeButton", "生成代码", ".interface-title",
        (ele) => {
            let buttonText = $(ele).next().text()
            if (buttonText == "添加接口") {
                return $(ele).next();
            }
            return null;
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).after('<button id="'+buiId+'" type="button" onclick="generatorInterfaceCode(1)" class="ant-btn btn-filter ant-btn-primary generatorCodeCatBtn" style="float: right;margin-right: 2px"><span>'+bText+'</span></button>');
        }
    )
    //导入json后新增一个新增分页包装
    let interfaceCshapPageButton = new InjectButton("interfaceCshapPageButton", "包装donet分页", ".import-json-button",
        (ele) => {
            let buttonText = $(ele).text()
            if (buttonText == "导入 json" && $(ele).parent().parent().attr("class")!="interface-edit-json-info") {
                return ele;
            }
            return null;
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).after('<button id="'+buiId+'" type="button" onclick="packagePage(0)" class="ant-btn import-json-button ant-btn-primary" style="margin-left: 2px"><span>'+bText+'</span></button>');
        }
    )
    let interfaceJavaPageButton = new InjectButton("interfaceJavaPageButton", "包装java分页", ".import-json-button",
        (ele) => {
            let buttonText = $(ele).text()
            if (buttonText == "导入 json" && $(ele).parent().parent().attr("class")!="interface-edit-json-info") {
                return ele;
            }
            return null;
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).after('<button id="'+buiId+'" type="button" onclick="packagePage(1)" class="ant-btn import-json-button ant-btn-primary" style="margin-left: 2px"><span>'+bText+'</span></button>');
        }
    )
    //页面注入按钮
    setInterval(function () {
        interfaceGeneratorCodeButton.inject();
        catGeneratorCodeButton.inject();
        interfaceCshapPageButton.inject();
        interfaceJavaPageButton.inject();
    }, 1000)
    window.addEventListener("message", function (e) {
        chrome.runtime.sendMessage(e.data, function (response) {
            if (response) {
                var templateReturn = JSON.parse(response)
                if (templateReturn["code"] == 0) {
                    var styleId = guid()
                    $(document.head).append("<style id='" + styleId + "' onload=\"cacheTemplate('" + encodeURIComponent(response) + "','" + styleId + "')\"></style>")
                }
            }
        });
    }, false);
})

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
