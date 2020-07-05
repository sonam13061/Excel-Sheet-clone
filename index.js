const $=require('jquery');
const electron = require('electron');
const dialog=require("electron").remote.dialog;
const fs=require("fs");
$(document).ready(
    function(){
        let db;
        $("#grid .cell").on("click",function(){
            let rid=Number($(this).attr("ri"));
            let cid=Number($(this).attr("ci"));
            let cidArr=String.fromCharCode(cid+65);
            $("#address-container").val(cidArr+(rid));
        })
        $(".menu-items").on("click",function(){
            $(".menu-options-item").removeClass("selected");
            let id=$(this).attr("id");
            $(`#${id}-options`).addClass("selected");
        })
        $("#New").on("click",function(){
             db=[]
             $("#grid").find(".row").each(function(){
                 let row=[];
                 $(this).find(".cell").each(function(){
                     let cell=false;
                     $(this).html("false");
                     row.push(cell);
                 })
                 db.push(row);
             })
             console.log(db);          
        })
        $("#Open").on("click",async function(){
            let odb=await dialog.showOpenDialog();
            let fp=odb.filePaths[0];
            let content=await fs.promises.readFileSync(fp);
            db=JSON.parse(content);
            let rows=$("#grid").find(".row");
            for(let i=0;i<rows.length;i++){
                let cRowcells=$(rows[i]).find(".cell");
                for(let j=0;j<cRowcells.length;j++){
                    $(cRowcells[j]).html(db[i][j]);
                }
            }



        })
        $("#grid .cell").on("keyup",function(){
            let rowid=$(this).attr("ri");
            let colid=$(this).attr("ci");
            db[rowid-1][colid]=$(this).html();
            console.log(db);
        })
        $("#Save").on("click", async function(){
          let sdb=await dialog.showOpenDialog();
           let jsonData=JSON.stringify(db);
           fs.writeFileSync(sdb.filePaths[0],jsonData,"UTF-8");
        })
        function init(){
            $("#File").trigger("click");
            $("#New").click();
        }
        init();
    }
)