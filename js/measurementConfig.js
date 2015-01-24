$(document).ready(function(){
    
    $("#submit").click(function(event){
        event.preventDefault();
        $("#infoBox").slideUp();
        
        $.post(
                "php/controller.php",
                {command: "generateConfig", dataFilesNum: $("#dataFilesNum").val(), minAngles: $("#minAngles").val(), maxTolerances: $("#maxTolerances").val() },
                function(result){
                    $("#infoBox strong").html(result);
                    if(document.getElementById("infoBox").style.display === "none"){
                        $("#infoBox").slideDown();
                    }
                },
                "json"
                );
    });
    
});