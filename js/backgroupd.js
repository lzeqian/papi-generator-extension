var ciServer="http://localhost:8888/"
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
            }
        })
    }
    return true;
});
