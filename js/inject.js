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

/**
 * 获取接口数据
 * @param interfaceId 接口id
 * @param projectId  项目id
 * @param ifHaveDesc 是否已经获取描述
 * @param callback 获取成功后异步回调函数
 */
function getInterFaceInfo(interfaceId,projectId,ifHaveDesc,callback){
    $.getJSON(apiList["getInterface"]+"?id="+interfaceId,function(result){
        if(result.errcode==0) {
            var interfaceData=result.data;
            var catid=interfaceData["catid"];
            if(!ifHaveDesc) {
                $.getJSON(apiList["getProject"]+"?id=" + projectId, function (cresult) {
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
        url: apiList["getUser"]+'?id='+uid,
        async:false,
        dataType:'json',
        success:function(res){
            userInfo=res.data;
        }
    })
    return userInfo;
}
/**
 *  调用远程服务生成代码
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
            $('<form action="' + templateServer + 'template/gen" method="post">' + inputs + '</form>').appendTo('body').submit().remove();
        })
    }else{
        //分类的id举例：cat_1891
        let catid=appid.split("_")[1];
        if(!catid){
            alert("请选择一个分类，请勿选择全部接口")
            return;
        }
        //列表分类下所有接口
        $.getJSON(apiList["getInterfaceAtCat"]+"?page=1&limit=200&catid="+catid,function(result) {
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
                        $('<form action="' + templateServer + 'template/gen" method="post">' + inputs + '</form>').appendTo('body').submit().remove();
                    }
                },10)

            }
        });
    }
}

/**
 * 用于接收模板列表的content-scripts回应
 * @param ptemplateList 模板列表字符串
 * @param styleId 共享dom元素id，用完自动删除
 */
function cacheTemplate(ptemplateList, styleId) {
    templateResponse = JSON.parse(decodeURIComponent(ptemplateList));
    $("#" + styleId).remove()
}

/**
 * 包装分页到响应结果中
 * @param type
 */
function packagePage(type){
    let jsonSchema=null;
    if(type==0){
        jsonSchema=dotnetJsonSchema;
    }else{
        jsonSchema=javaJsonSchema;
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

/**
 * 将所有的项目mock修改为带有code统一规范。
 */
function mockDefaultSpec(){
    let groupId = window.location.href.substring(window.location.href.lastIndexOf("/") + 1)
    $.getJSON(apiList["listProjectAtGroup"]+"?group_id="+groupId+"&page=1&limit=1000", function (cresult) {
        for(let project of cresult.data.list){
            let projectId=project["_id"]
            $.ajax({
                url: apiList["updateProject"],
                type:"post",
                contentType: "application/json;charset=UTF-8",
                data:JSON.stringify({
                    id: projectId,
                    is_mock_open: true,
                    project_mock_script: projectMockScript
                }),
                dataType:'json',
                success:function(res){

                }
            })
        }
        alert("mock成功,可进入项目->设置->全局mock脚本查看，或者点击某个get请求的mockurl进去查看响应结果");
    });
}
