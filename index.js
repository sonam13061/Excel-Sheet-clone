const $=require('jquery');
const electron = require('electron');
const dialog=require("electron").remote.dialog;
const fs=require("fs");
$(document).ready(
    function(){
        let db;
        $("#grid .cell").on("click",function(){
            let rid=Number($(this).attr("ri")); //find row number
            let cid=Number($(this).attr("ci")); //find col number
            let cidArr=String.fromCharCode(cid+65); // find col Address
            $("#address-container").val(cidArr+(rid+1)); //set address on address container
            let cellObject=getCellObject(rid,cid); 
            $("#formula-container").val(cellObject.formula); //set formula on formula container.
        })
        $(".menu-items").on("click",function(){
            $(".menu-options-item").removeClass("selected"); //remove selected class 
            let id=$(this).attr("id"); //find the current id( file or home)
            $(`#${id}-options`).addClass("selected"); //add selected class on current id.
        })
        $("#New").on("click",function(){
             db=[] //create array of database
            //  $("#grid").find(".row").each(function(){
            //      let row=[];
            //      $(this).find(".cell").each(function(){
            //          let cell={
            //              value:"",
            //              formula:"",

            //          };
            //          row.push(cell);
            //      })
            //      db.push(row);
            //  })
            let rows = $("#grid").find(".row"); //find array of rows in the grid 

            for (let i = 0; i < rows.length; i++) {
                let row = []; //create array for row.
                //find cells in a row.
                let cRowCells = $(rows[i]).find(".cell");
                for (let j = 0; j < cRowCells.length; j++) {
                    // DB
                    //make object for every cell.
                    let cell = {
                        value: "",
                        formula: "",
                        downstream:[], // cells which are dependent on current cell.
                        upstream:[]  //cells on which current cell is dependent.

                    }
                    row.push(cell); //push a cell in row.
                    // UI 
                    $(cRowCells[j]).html("");
                }
                db.push(row); //push the row in database.
            }
             console.log(db);          
        })
        $("#Open").on("click", async function () {
            let odb = await dialog.showOpenDialog(); //open dialog for open.
            let fp = odb.filePaths[0]; //store path of file in fp.
            let content = await  fs.promises.readFile(fp); //store the content of file
            db = JSON.parse(content); // store content to db.
            console.log(db); 
            let rows = $("#grid").find(".row");
            for (let i = 0; i < rows.length; i++) {
                let cRowCells = $(rows[i]).find(".cell");
                for (let j = 0; j < cRowCells.length; j++) {
             
                    $(cRowCells[j]).html(db[i][j]);
                    //set db[i][j] to every cell.
                }
            }
        })
        $("#grid .cell").on("blur",function(){
            // let rowid=$(this).attr("ri");
            // let colid=$(this).attr("ci");
            // db[rowid][colid]=$(this).html();
             console.log("cell fn");
             let{rowId,colId}=getRC(this);
             console.log(rowId +" "+colId);
             let cellObject=getCellObject(rowId,colId);
             
             if($(this).html()==cellObject.value){
                
                 return;
             }
             if(cellObject.formula){
                console.log("Formula removed")
                 removeFormula(cellObject,rowId,colId);
             }
             cellObject.value = $(this).html();
             // updateCell=> update self // childrens(UI changes)

             updateCell(rowId, colId, $(this).html(), cellObject);

            // console.log(db);
        })
        $("#Save").on("click", async function(){
          let sdb=await dialog.showOpenDialog();
           let jsonData=JSON.stringify(db);
           console.log(sdb.filePaths[0]);
           await fs.promises.writeFile(sdb.filePaths[0],jsonData,"UTF-8");
        })
        $("#formula-container").on("blur",function(){
             let address=$("#address-container").val();
             let{rowId,colId}=getRCfromAddress(address);
             let cellObject=getCellObject(rowId,colId);
             let formula=$(this).val();
             cellObject.formula=formula;
             let evaluatedVal=evaluate(cellObject);
             setupformula(rowId,colId,formula);
             updateCell(rowId,colId,evaluatedVal,cellObject);

        })
        function getRC(elem){
            let rowId=$(elem).attr("ri");
            let colId=$(elem).attr("ci");
            return{
                rowId,
                colId
            }

        }
        function getRCfromAddress(address){
            let colId=address.charCodeAt(0)-65;
            let rowId=Number(address.substring(1))-1;
            return{
                rowId,
                colId
            }
        }
        function getCellObject(rowId,colId){
           return db[rowId][colId];
            //console.log(db[rowId])
        }
        function evaluate(cellObject){
            let formula=cellObject.formula;
            let formulaComponent=formula.split(" ");
            for(let i=0;i<formulaComponent.length;i++){
                let code=formulaComponent[i].charCodeAt(0);
                if(code>=65 && code<=90){
                    let ParentRc=getRCfromAddress(formulaComponent[i]);
                    let fparent=db[ParentRc.rowId][ParentRc.colId];
                    let value=fparent.value;
                    formula=formula.replace(formulaComponent[i],value);

                }
            }
            console.log(formula);
            console.log(typeof formula)
            let ans = eval(formula);
            console.log(ans);
            return ans;
        }
        function updateCell(rowId,colId,val,cellObject){
            $(`#grid .cell[ri=${rowId}][ci=${colId}]`).html(val);
            cellObject.value = val;
            for(let i=0;i<cellObject.downstream.length;i++){
                let sdsorc=cellObject.downstream[i];
                let fdso=db[sdsorc.rowId][sdsorc.colId];
                let evaluatedVal=evaluate(fdso);
                updateCell(sdsorc.rowId,sdsorc.colId,evaluatedVal,fdso);
            }
            
        }
        function removeFormula(cellObject,rowId,colId){
            for(let i=0;i<cellObject.upstream.length;i++){
                let suso=cellObject.upstream[i];
                let fuso=db[suso.rowId][suso.colId];
                let fds=fuso.downstream.filter(function(rc){
                    return (!(rc.rowId==rowId && rc.colId==colId));
                })
                fuso.downstream=fds;
            }
            cellObject.upstream=[];
            cellObject.formula="";
        }
        function setupformula(rowId,colId,formula){
            let cellObject=getCellObject(rowId,colId);
            let formulaComponent=formula.split(" ");
            for(let i=0;i<formulaComponent.length;i++){
                let code=formulaComponent[i].charCodeAt(0);
                if(code>=65 && code<=90 ){
                    let ParentRc=getRCfromAddress(formulaComponent[i]);
                    let fparent=db[ParentRc.rowId][ParentRc.colId];
                    fparent.downstream.push(
                        {
                        rowId,
                        colId
                        }
                    )
                    cellObject.upstream.push(
                        {
                            rowId:ParentRc.rowId,
                            colId:ParentRc.colId
                        }
                    )
                }

            }
        }
        function init(){
            $("#File").trigger("click");
            $("#New").click();
        }

        init();
    }
)