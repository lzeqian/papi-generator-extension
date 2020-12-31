//模板服务器地址
var templateServer="http://192.168.1.35:8808/"
//donet分页的schema信息
var dotnetJsonSchema='{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"pageIndex":{"type":"number","description":"当前页","title":"当前页"},"pagesCount":{"type":"number","title":"总页数","description":"总页数"},"pageSize":{"type":"number","title":"每页显示行数","description":"每页显示行数"},"recordsCount":{"type":"number","title":"总记录数","description":"总记录数"},"dataSource":{"type":"array","items":{"type":"object","properties":{},"required":[]}}},"required":["pageIndex","pagesCount","pageSize","recordsCount","dataSource"],"title":"分页数据","description":"分页数据"}'
//java分页的schema信息
var javaJsonSchema='{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"total":{"type":"string","title":"总记录数","description":"总记录数"},"list":{"type":"array","items":{"type":"object","properties":{},"title":"分页数据","description":"分页数据"},"title":"当前页数据","description":"当前页数据"},"pageNum":{"type":"number","title":"每页显示行数","description":"每页显示行数"},"pageSize":{"type":"number","title":"总页数","description":"总页数"}},"description":"分页对象","title":"分页对象","required":["total","list","pageNum","pageSize"]}';
//project模拟脚本
var projectMockScript="mockJson = {\n"+
    "    code: 10000, \n"+
    "    message: \"\", \n"+
    "    data: mockJson \n"+
"}"
//api接口地址
var apiList={
    "listProjectAtGroup":"/api/project/list" , //列表分组下所有项目
    "updateProject":"/api/project/up",//更新项目信息
    "getInterface":"/api/interface/get", //获取单接口信息
    "getProject":"/api/project/get", //获取项目信息，项目中包含所有分类
    "getUser":"/api/user/find", //获取用户信息
    "getInterfaceAtCat":"/api/interface/list_cat" //列表分类下所有接口
}
//注入按钮的通用样式
var injectButtonStyle="background-color: #ABA00D;border-color:#ABA00D"

//注入按钮帮助类，一般用于content-scripts.js中
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
/**
 * 生成guid
 * */
function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
