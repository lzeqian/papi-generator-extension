var templateResponse = null
/**
 * 点击生成按钮弹出对话框让用户输入包名和选择
 * genType=0表示生成单个接口
 * genType=1表示生成整个分类
 * **/
function generatorInterfaceCode(genType) {
    var catId = window.location.href.substring(window.location.href.lastIndexOf("/") + 1)
    var projectPath = window.location.href.split("/project/")[1]
    var projectId = projectPath.substring(0, projectPath.indexOf("/"))
    window.postMessage({requestType: "getAllTemplate"}, '*');
    var si = setInterval(function () {
        if (templateResponse != null) {
            clearInterval(si)
            //弹出窗口
            var templateHtml = "<div id=\"dialog\" title=\"生成代码对话框\" >\n" +
                "请选择模板：<select name='templateGroupName' style='width: 160px;height: 20px'>"


            for(let template of templateResponse.data){
                templateHtml+="<option value='"+template+"'>"+template+"</option>"
            }
            templateHtml += "</select><p></p><p></p>"
            templateHtml += "请输入包名：<input name='package' value='com.jieztech' style='width: 160px;height: 20px;;margin-top: 10px'/><p></p>"
            templateHtml += "<button style='margin-left: 140px;margin-top: 10px' onclick='remoteGenerator("+genType+",\""+catId+"\",\""+projectId+"\")'>生成</button>&nbsp;&nbsp;"
            templateHtml += "<button style='margin-top: 10px' onclick='$( \"#dialog\" ).dialog( \"close\" );'>取消</button>"
            templateHtml += "</div>"
            $(document.body).append(templateHtml)
            $("#dialog").dialog({
                close: function( event, ui ) {
                    $( "#dialog" ).remove()
                }
            });
        }
    }, 100)

}
function getInterFaceInfo(interfaceId,projectId,ifHaveDesc,callback){
    $.getJSON("/api/interface/get?id="+interfaceId,function(result){
        if(result.errcode==0) {
            var interfaceData=result.data;
            var catid=interfaceData["catid"];
            if(!ifHaveDesc) {
                $.getJSON("/api/project/get?id=" + projectId, function (cresult) {
                    if (cresult.errcode == 0) {
                        projectData = cresult.data;

                        for (catTmp of projectData.cat) {
                            if (catTmp._id == catid) {
                                callback(interfaceData, catTmp.desc.trim().replace(" ", ""),catTmp.name)
                                break;
                            }
                        }

                    }
                })
            }else{
                callback(interfaceData, null)
            }
        }
    })
}
/**
 *  获取用户id
 * */
function getUserInfo(uid){
    var userInfo=null;
    $.ajax({
        url: '/api/user/find?id='+uid,
        async:false,
        dataType:'json',
        success:function(res){
            userInfo=res.data;
        }
    })
    return userInfo;
}
/**
 *  genType表示生成单个接口还是集合
 * */
function remoteGenerator(genType,appid,projectId){
    var paramData={
        templateGroupName:$("select[name='templateGroupName']").val(),
        catDescription:"",
        package:$("input[name='package']").val(),
        interfaceList:[]
    }
    $( "#dialog" ).dialog( "close" );
    //查询生成类型为0，appid为接口id
    if(genType==0){
        //获取接口详细数据
        getInterFaceInfo(appid,projectId,false,function(interfaceData,catDesc,catName){
            paramData["interfaceList"]=[interfaceData]
            paramData["catDescription"]=catDesc
            paramData["catName"]=catName
            let userInfo=getUserInfo(interfaceData.uid)
            paramData["userEmail"]=userInfo.email;
            paramData["userName"]=userInfo.username;
            console.log(paramData)
            console.log(JSON.stringify(paramData))
            let apiRegex=/^\/.+\/api\/v[0-9]+\/.+$/
            if(!apiRegex.test(interfaceData.path)){
                alert("不满足接口规范:/服务名称/api/v版本号/功能定义")
                return;
            }
            let inputs="<input name='jsonData' value='"+encodeURIComponent(JSON.stringify(paramData))+"'>"
            $('<form action="' + ciServer + 'template/gen" method="post">' + inputs + '</form>').appendTo('body').submit().remove();
        })
    }else{
        //分类的id举例：cat_1891
        let catid=appid.split("_")[1];
        //列表分类下所有接口
        $.getJSON("/api/interface/list_cat?page=1&limit=200&catid="+catid,function(result) {
            if (result.errcode == 0) {
                var ifHaveDesc=false
                for(let re of result.data.list){
                    let interfaceId=re["_id"];
                    getInterFaceInfo(interfaceId,projectId,ifHaveDesc,function(interfaceData,catDesc,catName){
                        paramData["interfaceList"].push(interfaceData)
                        if(catDesc) {
                            paramData["catDescription"] = catDesc
                            paramData["catName"] = catName
                            let userInfo=getUserInfo(interfaceData.uid)
                            paramData["userEmail"]=userInfo.email;
                            paramData["userName"]=userInfo.username;
                        }
                    });
                    ifHaveDesc=true;
                }
                var asyncInterval=setInterval(function () {
                    if(paramData["interfaceList"].length==result.data.list.length){
                        clearInterval(asyncInterval)
                        console.log(paramData)
                        console.log(JSON.stringify(paramData))
                        let apiRegex = /^\/.+\/api\/v[0-9]+\/.+$/
                        for (let interfaceData of paramData.interfaceList) {
                            if (!apiRegex.test(interfaceData.path)) {
                                alert("不满足接口规范:/服务名称/api/v版本号/功能定义")
                                return;
                            }
                        }
                        let inputs="<input name='jsonData' value='"+encodeURIComponent(JSON.stringify(paramData))+"'>"
                        $('<form action="' + ciServer + 'template/gen" method="post">' + inputs + '</form>').appendTo('body').submit().remove();
                    }
                },10)

            }
        });
    }
}
function cacheTemplate(ptemplateList, styleId) {
    templateResponse = JSON.parse(decodeURIComponent(ptemplateList));
    $("#" + styleId).remove()
}
function packagePage(type){
    let jsonSchema=null;
    if(type==0){
        jsonSchema='{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"pageIndex":{"type":"number","description":"当前页","title":"当前页"},"pagesCount":{"type":"number","title":"总页数","description":"总页数"},"pageSize":{"type":"number","title":"每页显示行数","description":"每页显示行数"},"recordsCount":{"type":"number","title":"总记录数","description":"总记录数"},"dataSource":{"type":"array","items":{"type":"object","properties":{},"required":[]}}},"required":["pageIndex","pagesCount","pageSize","recordsCount","dataSource"],"title":"分页数据","description":"分页数据"}'
    }else{
        jsonSchema='{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"total":{"type":"string","title":"总记录数","description":"总记录数"},"list":{"type":"array","items":{"type":"object","properties":{},"title":"分页数据","description":"分页数据"},"title":"当前页数据","description":"当前页数据"},"pageNum":{"type":"number","title":"每页显示行数","description":"每页显示行数"},"pageSize":{"type":"number","title":"总页数","description":"总页数"}},"description":"分页对象","title":"分页对象","required":["total","list","pageNum","pageSize"]}';
    }
    $("#yapi > div > div.router-main > div.router-container > div > div > div.ant-layout.ant-layout-has-sider > div.ant-layout > div > div > div > div.interface-edit > div > form > div:nth-child(8) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div > button:nth-child(1)").click()
    //选中JSONJSON-SCHEMA页签
    $("div[role='document']").find("div[role='tab']").each(function (i, ele) {
        if($(ele).text()=="JSON-SCHEMA"){
            $(ele).click();
        }
    })
    let currentTabPanel=$("div[role='document']").find("div[role='tabpanel']").filter(".ant-tabs-tabpane-active").find(".ace_editor")
    let aceEditor=window.ace.edit(currentTabPanel[0])
    aceEditor.setValue(jsonSchema);
    $("div[role='document']").find("button[type='button']").each(function (i, ele) {
        if($(ele).text()=="确 定"){
            $(ele).click();
        }
    })
}

