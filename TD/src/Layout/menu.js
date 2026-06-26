//メニューを扱うjs

const Menu={
    StartTime:Date.now(),
    NowTime() {
        const elapsed = Date.now() - this.StartTime;

        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const centiseconds = Math.floor((elapsed % 1000) / 10); // 1/100秒

        return `${String(minutes).padStart(2, "0")}:${
            String(seconds).padStart(2, "0")
        }:${
            String(centiseconds).padStart(2, "0")
        }`;
    },
    showtime:document.getElementById("showtime"),
    showscore:document.getElementById("showscore"),
    showcost:document.getElementById("showcost"),
    summonmenu:document.getElementById("summonmenu"),
    //メニューのレイアウトを作成
    update(){
        Menu.showtime.innerHTML=Menu.NowTime();
        Menu.showscore.innerHTML=ScoreSystem.GameScore;
        Menu.showcost.innerHTML=ScoreSystem.GameCost;
    },
    forcas(grid){
        console.log(grid.x,grid.y)
        this.summonmenu.innerHTML="";
        //生成可能なアイテムのリストを表示
        //そのマスに建物があるか確認
        let buildingflag=grid.onEntity.some(e=>e.Category=="building");

        if(grid.faction=="our"){
            Object.values(EntityType).forEach(e=>{
                //プレイアブルであれば表示
                if(e.playable){
                    //建物カテゴリで既に建物があれば表示しない
                    if(e.Category=="building"&&buildingflag)return;
                    //表示用のDOMを生成してsummonmenuに加える
                    const p=document.createElement("div");
                    p.innerHTML=`${e.name}:cost${e.cost}`;
                    const input=document.createElement("input");
                    input.type="button";
                    input.value="Summon";
                    input.onclick=()=>{new Entity(grid.x,grid.y,e.label,'our','Suppress')}
                    p.appendChild(input);
                    this.summonmenu.appendChild(p);
                }
            })
        }
    }

}