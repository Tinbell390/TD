//レイアウトを行うjs
const factionList={
    neutral:{
        color:"azure"
    },
    our:{
        color:"skyblue",
        SuppressionTarget:[3,5,7]
    },
    enemy1:{
        color:"red",
        SuppressionTarget:[2,4,6]
    }
}
// 0:中立
// 1:自陣
// 2:敵陣

const grid_mode_List=[
    {
        name:"荒野",
        context:"",
        color:"gray",
        faction:"neutral",
        pass:false,
        through:true
    },
    {
        name:"通路",
        context:"",
        color:"chartreuse",
        faction:"neutral",
        pass:true,
        through:true
    },
    {
        name:"司令部",
        context:"HQ",
        color:"skyblue",
        faction:"our",        
        pass:true,
        through:true
    },
    {
        name:"司令部",
        context:"HQ",
        color:"red",
        faction:"enemy1",        
        pass:true,
        through:true
    },
    {
        name:"飛行場",
        context:"H",
        color:"skyblue",
        faction:"our",        
        pass:true,
        through:true
    },
    {
        name:"飛行場",
        context:"H",
        color:"red",
        faction:"enemy1",        
        pass:true,
        through:true
    },
    {
        name:"前線基地",
        context:"B",
        color:"skyblue",
        faction:"our",        
        pass:true,
        through:true
    },
    {
        name:"前線基地",
        context:"B",
        color:"red",
        faction:"enemy1",        
        pass:true,
        through:true
    },
]
// 0:荒野
// 1:通路
// 2:自陣司令部
// 3:敵陣司令部
// 4:自陣飛行場
// 5:敵陣飛行場
// 6:自陣前線基地
// 7:敵陣前線基地
// 8:

let scopegrid={};
let selectedGrid;

class Grid{//マス情報
    constructor(x,y,mode){
        this.x=x;
        this.y=y;
        this.mode=mode;
        this.faction=grid_mode_List[mode].faction;
        this.pass=grid_mode_List[mode].pass;
        this.through=grid_mode_List[mode].through;
        this.onEntity=[];
        this.update();
    }
    update(){
        //modeに対応するマスに塗り替える
        let color=factionList[this.faction].color;
        if(this.faction=="neutral")color=grid_mode_List[this.mode].color;
        Square_Layer.fillStyle=color;
        Square_Layer.fillRect(
            this.x * stage_grid_size,
            this.y * stage_grid_size,
            stage_grid_size,
            stage_grid_size
        );
        const text = grid_mode_List[this.mode].context;
        if(text){
            Square_Layer.fillStyle = "black";
            Square_Layer.font = "16px sans-serif";
            Square_Layer.textAlign = "center";
            Square_Layer.textBaseline = "middle";

        }
    }
    change(mode){
        this.mode=mode;
        this.faction=grid_mode_List[mode].faction;
        this.pass=grid_mode_List[mode].pass;
        this.through=grid_mode_List[mode].through;
        this.update();
    }
}

//マンハッタン距離のリスト
function createOffsets(distance) {
  const offsets = [];

  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      if (Math.abs(dx) + Math.abs(dy) === distance) {
        offsets.push({x:dx, y:dy});
      }
    }
  }

  return offsets;
}
const DEST=[]
for(let i=0;i<=10;i++){
    DEST[i]=createOffsets(i);
}

//名前と勢力からマス分類番号を取得する関数
function getGridModeIndex(name, faction){
    return grid_mode_List.findIndex(
        mode =>
            mode.name === name &&
            mode.faction === faction
    );
}


function make_grid(){//グリッド描画関数
    //縦線を描画
    for(let i=0;i<=stage_grid_x;i++){
        Grid_Layer.beginPath();
        Grid_Layer.moveTo(i*stage_grid_size,0);
        Grid_Layer.lineTo(i*stage_grid_size,stage_grid_y*stage_grid_size);
        Grid_Layer.stroke();
    }
    //横線を描画
    for(let i=0;i<=stage_grid_y;i++){
        Grid_Layer.beginPath();
        Grid_Layer.moveTo(0,i*stage_grid_size);
        Grid_Layer.lineTo(stage_grid_x*stage_grid_size,i*stage_grid_size);
        Grid_Layer.stroke();
    }
}

function make_map(){
    for(let y=0;y<stage_grid_y;y++){
        StageGridList[y]=[];
        for(let x=0;x<stage_grid_x;x++){
            StageGridList[y][x]=new Grid(x,y,mapdata[y][x]);
        }
    }
}

function startup_entity(){
    for(let y=0;y<stage_grid_y;y++){
        for(let x=0;x<stage_grid_x;x++){
            //自陣司令部
            if(StageGridList[y][x].mode==2){
                new Entity(x,y,"HQ","our","Building");
            }
            else if(StageGridList[y][x].mode==3){
                new Entity(x,y,"HQ","enemy1","Building");
            }
            else if(StageGridList[y][x].mode==4){
                new Entity(x,y,"H","our","Building");
            }
            else if(StageGridList[y][x].mode==5){
                new Entity(x,y,"H","enemy1","Building");
            }
            else if(StageGridList[y][x].mode==6){
                new Entity(x,y,"B","our","Building");
            }
            else if(StageGridList[y][x].mode==7){
                new Entity(x,y,"B","enemy1","Building");
            }
        }
    }
}


Entity_Layer.addEventListener("click", (e) => {

    const rect = Entity_.getBoundingClientRect();

    const x = Math.floor(
        (e.clientX - rect.left) / stage_grid_size
    );

    const y = Math.floor(
        (e.clientY - rect.top) / stage_grid_size
    );

    selectGrid(x, y);
});

function selectGrid(x, y){

    //範囲外チェック
    if(
        x < 0 || x >= stage_grid_x ||
        y < 0 || y >= stage_grid_y
    ){
        return;
    }

    const grid = StageGridList[y][x];

    //scopegridへ格納
    scopegrid.x = grid.x;
    scopegrid.y = grid.y;
    scopegrid.mode = grid.mode;
    scopegrid.faction = grid.faction;
    scopegrid.pass = grid.pass;
    scopegrid.through = grid.through;
    scopegrid.onEntity = grid.onEntity;

    selectedGrid = grid;
    console.log(scopegrid)
    drawSelectedGrid();
}

function drawSelectedGrid(){

    Entity_Layer.clearRect(
        0,
        0,
        stage_grid_x * stage_grid_size,
        stage_grid_y * stage_grid_size
    );

    if(!selectedGrid) return;

    Entity_Layer.strokeStyle = "yellow";
    Entity_Layer.lineWidth = 3;

    Entity_Layer.strokeRect(
        selectedGrid.x * stage_grid_size,
        selectedGrid.y * stage_grid_size,
        stage_grid_size,
        stage_grid_size
    );
}