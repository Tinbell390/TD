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

    }

}