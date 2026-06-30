//メニューを扱うjs

const Menu={
    StartTime:Date.now(),
    lastState : "",
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
        Menu.updateSummonMenu();
    },
    forcas(grid){
        if(!grid)return;
        this.summonmenu.innerHTML="";
        //生成可能なアイテムのリストを表示
        //そのマスに建物があるか確認
        let buildingflag=grid.onEntity.some(e=>e.Category=="building");
        let infantryflag=!(grid.name=="司令部"||grid.name=="飛行場");

        if(grid.faction=="our"){
            Object.values(EntityType).forEach(e=>{
                //プレイアブルであれば表示
                if(e.playable){
                    //建物カテゴリで既に建物があれば表示しない
                    if(e.Category=="building"&&buildingflag)return;
                    //兵士カテゴリで司令部か飛行場でなければ表示しない
                    if(e.Category=="infantry"&&infantryflag)return;
                    //表示用のDOMを生成してsummonmenuに加える
                    const p=document.createElement("div");
                    p.innerHTML=`${e.name}:cost${e.cost}`;
                    const input=document.createElement("input");
                    input.type="button";
                    input.value="Summon";
                    input.onclick=()=>{
                        console.log("summon");
                        summonEntity(grid.x,grid.y,e.label,'our',e.Category=="building"?"Turret":'Suppress')}
                    p.appendChild(input);
                    this.summonmenu.appendChild(p);
                }
            })
        }
        
    },
    updateSummonMenu() {
        if (!selectedGrid) return;

        const state = JSON.stringify({
            x: selectedGrid.x,
            y: selectedGrid.y,
            faction: selectedGrid.faction,
            name: selectedGrid.name,
            onEntity: selectedGrid.onEntity.map(e => e.id) // または label 等
        });

        if (state !== this.lastState) {
            this.lastState = state;
            Menu.forcas(selectedGrid);
        }
    }
}