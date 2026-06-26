//DOM
const stage=document.getElementById("stage");
const menu=document.getElementById("menu");
const Square_=document.getElementById("Square_Layer")
const Square_Layer = Square_.getContext("2d");
const Grid_=document.getElementById("Grid_Layer")
const Grid_Layer = Grid_.getContext("2d")
const Entity_=document.getElementById("Entity_Layer")
const Entity_Layer = Entity_.getContext("2d")

//gameパラメータ
const fps=30;
let gametime=0;                             //時間
const map=mapdata;
let stopflag=false;                         //進行制御フラグ
let winflag1=true;                          //敵陣司令部破壊で勝利

let lossflag1=true;                         //自陣司令部破壊で敗北


//stageパラメータ
const stage_grid_size=30;                   //グリットサイズ
const stage_grid_y=20;                               //縦マス数
const stage_grid_x=60;                               //横マス数
const StageGridList=[];                               //ステージ上のマスの情報

//scoreパラメータ

//Entity関連
const EntityList=[]

//debugパラメータ


make_grid();
make_map();
startup_entity();

function gameloop(){
    if(stopflag)return;
    EntityList.forEach(e=>{
        e.update();
    })
    //deathflagが真の要素をすべて削除
    for(let i=EntityList.length-1;i>=0;i--){
        if(EntityList[i].deathflag){
            EntityList.splice(i,1);
        }
    }
    ScoreSystem.CheckScore();
    if(gametime%(fps*5)==0) {
        ScoreSystem.Cooperate();
    }
    Menu.update();
    gametime++;
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        stopflag = !stopflag;
        console.log(stopflag?"stop":"start");
    }
});

setInterval(gameloop, 1000/fps);
//エンティティテスト用

new Entity(22,7,"SG","our","Suppress");
// new Entity(22,7,"RF","our","Suppress");
new Entity(22,7,"SMG","our","Suppress");
new Entity(22,7,"HMG","our","Suppress");

// new Entity(37,7,"LMG","enemy1","Suppress");
new Entity(37,7,"AR","enemy1","Suppress");
new Entity(37,7,"AR","enemy1","Suppress");
new Entity(37,7,"AR","enemy1","Suppress");