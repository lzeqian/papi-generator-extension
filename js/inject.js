var templateResponse = null
var ciServer="http://localhost:8888/"
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
                                callback(interfaceData, catTmp.desc.trim().replaceAll(" ", ""),catTmp.name)
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


