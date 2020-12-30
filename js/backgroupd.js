chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if(request.requestType=="getAllTemplate"){
        $.ajax({
            type:'get',
            url:ciServer+"template/list",
            async:false,
            dataType:'json',
            success:function(res){
                sendResponse(JSON.stringify(res))
            },
            error:function(jqXHR, textStatus, errorThrown){
                alert("无法连接模板服务器"+errorThrown)
            }
        })
    }
    return true;
});
