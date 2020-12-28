
/**
* 注入js
* */
function injectCustomJs(jsPath,callback)
{
    var temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    temp.src = chrome.extension.getURL(jsPath);// 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    temp.onload=function(){
        callback&&callback();
    }
    document.head.appendChild(temp);
}
/**
 * 注入css
 * */
function injectCustomCss(cssPath)
{
    var temp = document.createElement('link');
    temp.setAttribute('rel', 'stylesheet');
    temp.setAttribute('href', chrome.extension.getURL(cssPath));
    document.head.appendChild(temp);
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
    injectCustomJs('js/inject.js')
    injectCustomJs('external/jquery-1.11.0.min.js',function(){
        injectCustomJs('external/jquery-ui.min.js')
        injectCustomCss('external/jquery-ui.min.css')
    })
    //页面注入按钮
    setInterval(function () {
        var appendGeneratorCode = false
        var generatorCodeOffsetNode=null;
        var appendGeneratorCatCode = false
        var generatorCodeCatOffsetNode=null;
        //找到接口对应的导航栏并且注入生成代码按钮
        $(".ant-tabs-tab").each(function (i, ele) {
            if (ele.innerText == "高级Mock") {
                generatorCodeOffsetNode=ele;
            }
            if (ele.innerText == "生成代码") {
                appendGeneratorCode=true;
            }
        })
        if($(".generatorCodeBtn").length>0) appendGeneratorCode=true;
        if (!appendGeneratorCode) {
            $(generatorCodeOffsetNode).parent().append('<button type="button" onclick="generatorInterfaceCode(0)" class="ant-btn btn-filter ant-btn-primary generatorCodeBtn"><span>生成代码</span></button>')
            appendGeneratorCode = true;
        }
        //找到分类栏对应的interface-title并在后面的按钮后添加一个新的生成代码按钮
        $(".interface-title").each(function (i, ele) {
            let buttonText=$(ele).next().text()
            if(buttonText=="添加接口"){
                generatorCodeCatOffsetNode=$(ele).next();
            }
        });
        if($(".generatorCodeCatBtn").length>0) appendGeneratorCatCode=true;
        if (!appendGeneratorCatCode && generatorCodeCatOffsetNode!=null) {
            console.log(generatorCodeCatOffsetNode)
            $(generatorCodeCatOffsetNode).after('<button type="button" onclick="generatorInterfaceCode(1)" class="ant-btn btn-filter ant-btn-primary generatorCodeCatBtn" style="float: right;margin-right: 2px"><span>生成代码</span></button>');
            appendGeneratorCatCode = true;
        }
    }, 1000)
    window.addEventListener("message", function(e)
    {
        chrome.runtime.sendMessage(e.data, function(response) {
            if(response) {
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
