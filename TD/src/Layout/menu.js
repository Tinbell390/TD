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
    forcas(grid_x,grid_y,faction,name){
        this.summonmenu.innerHTML="";
        //生成可能なアイテムのリストを表示
        //そのマスに建物があるか確認
        let buildingflag=false;
        let stgegrid=StageGridList[grid_y][gird_x];
        stagegrid.onEntity.forEach(e=>{
            if(e.Category=="building")buidingflag=true;
        })
        if(faction=="our"){
            EntityType.forEach(e=>{
                //プレイアブルであれば表示
                if(e.playable){
                    //建物カテゴリで既に建物があれば表示しない
                    if(e.Category=="building"&&!buildingflag)return;
                    //表示用のDOMを生成してsummonmenuに加える
                    
                }
            })
        }
    }

}