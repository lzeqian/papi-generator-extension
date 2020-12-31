
/**
 *  content-scripts和原始页面共享DOM，但是不共享JS，如要访问页面JS（例如某个JS变量），只能通过injected js来实现。content-scripts不能访问绝大部分chrome.xxx.api，除了下面这4种：
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
    let injectButtonList=[];
    //接口页面生成代码按钮
    injectButtonList.push(new InjectButton("interfaceGeneratorCodeButton", "生成代码", ".ant-tabs-tab",
        (ele) => {
            return ele.innerText == "高级Mock" ? ele : null
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).parent().append('<button id="'+buiId+'" type="button" onclick="generatorInterfaceCode(0)" class="ant-btn btn-filter ant-btn-primary generatorCodeBtn" style="'+injectButtonStyle+'"><span>'+bText+'</span></button>')
        }
    ));
    //分类页面生成代码按钮
    injectButtonList.push(new InjectButton("catGeneratorCodeButton", "生成代码", ".interface-title",
        (ele) => {
            let buttonText = $(ele).next().text()
            if (buttonText == "添加接口") {
                return $(ele).next();
            }
            return null;
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).after('<button id="'+buiId+'" type="button" onclick="generatorInterfaceCode(1)" class="ant-btn btn-filter ant-btn-primary generatorCodeCatBtn" style="float: right;margin-right: 2px;'+injectButtonStyle+'"><span>'+bText+'</span></button>');
        }
    ));
    //导入json后新增一个新增donet分页包装
    injectButtonList.push(new InjectButton("interfaceCshapPageButton", "包装donet分页", ".import-json-button",
        (ele) => {
            let buttonText = $(ele).text()
            if (buttonText == "导入 json" && $(ele).parent().parent().attr("class")!="interface-edit-json-info") {
                return ele;
            }
            return null;
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).after('<button id="'+buiId+'" type="button" onclick="packagePage(0)" class="ant-btn import-json-button ant-btn-primary" style="margin-left: 2px;'+injectButtonStyle+'"><span>'+bText+'</span></button>');
        }
    ));
    //导入json后新增一个新增java分页包装
    injectButtonList.push(new InjectButton("interfaceJavaPageButton", "包装java分页", ".import-json-button",
        (ele) => {
            let buttonText = $(ele).text()
            if (buttonText == "导入 json" && $(ele).parent().parent().attr("class")!="interface-edit-json-info") {
                return ele;
            }
            return null;
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).after('<button id="'+buiId+'" type="button" onclick="packagePage(1)" class="ant-btn import-json-button ant-btn-primary" style="margin-left: 2px;'+injectButtonStyle+'"><span>'+bText+'</span></button>');
        }
    ));
    //项目列表页面新增一个注入mock包装按钮
    injectButtonList.push(new InjectButton("projectMockButton", "mock规范", 'a[href="/add-project"]',
        (ele) => {
            let buttons = $(ele).find("button")
            if (buttons.length>0) {
                return ele;
            }
            return null;
        }, (buiId, bText,offsetNode) => {
            $(offsetNode).after('<button id="'+buiId+'" type="button" onclick="mockDefaultSpec()" class="ant-btn ant-btn-primary" style="margin-left: 2px;'+injectButtonStyle+'"><span>'+bText+'</span></button>');
        }
    ));
    //页面注入按钮
    setInterval(function () {
        for(let inBtn of injectButtonList){
            inBtn.inject();
        }
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

