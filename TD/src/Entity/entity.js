const EntityMode={
    idle:"",
    attack:"",
    move:"",
    reload:""
}

class Entity{
    constructor(grid_x,grid_y,type,faction,actionmode){
        if(!EntityType[type]){
            throw new Error(`Unknown EntityType: ${type}`);
        }
        if(!factionList[faction]){
            throw new Error(`Unknown FactionType: ${faction}`);
        }
        const t=EntityType[type];
        //EntityTypeから継承
        Object.assign(this, EntityType[type]);

        this.grid_x=grid_x;
        this.grid_y=grid_y;
        this.x=(grid_x+0.5)*stage_grid_size;
        this.y=(grid_y+0.5)*stage_grid_size;

        //ステータス
        this.CurrentHp=this.MaxHp;
        this.CurrentAmmo=this.MaxAmmo;
        this.A_Attack=this.B_Attack;
        this.A_Accuracy=this.B_Accuracy;
        this.A_Dodge=this.B_Dodge
        this.A_FireRate=this.B_FireRate
        this.A_Armor=this.B_Armor;
        this.A_Penetrat=this.B_Penetrat;
        this.A_Speed=this.B_Speed;
        this.A_Critical=this.B_Critical
        this.A_CriticalDMG=this.B_CriticalDMG;
        

        this.type = type;
        this.faction = faction;
        this.action=EntityAI.Action[actionmode];
        this.search=EntityAI.Search[this.searchmode];
        this.attackaction=EntityAI.Attack[this.attackmode];
        this.mode="idle";
        this.dest=null;
        this.target=null;
        this.route=null;
        this.wait=0;
        this.hitList=[];
        this.buffList=[];
        this.deathflag=false;
        this.killfaction;
        this.reloadwait=0;
        
        //DOMの生成
        this.node=document.createElement("div");
        this.node.style.backgroundColor=factionList[faction].color;
        this.node.style.font="10px sans-serif";
        this.node.innerHTML=t.label;
        this.node.style.position="absolute";
        this.node.style.left=(grid_x+0.5)*stage_grid_size+"px";
        this.node.style.top=(grid_y+0.5)*stage_grid_size+"px";
        this.node.style.transform = "translate(-50%, -50%)";
        this.node.style.display = "flex";
        this.node.style.justifyContent = "center"; // 横中央
        this.node.style.alignItems = "center";     // 縦中央
        this.node.style.border = "2px solid black";
        if(this.Category=="building"){
            this.node.style.width="20px";
            this.node.style.height="27px";
        }
        else if(this.Category=="infantry"){
            this.node.style.width="20px";
            this.node.style.height="20px";
            this.node.style.borderRadius="50%";
        }

        // HPバー外枠
        this.hpBar=document.createElement("div");
        this.hpBar.style.position="absolute";
        this.hpBar.style.left="50%";
        this.hpBar.style.top="-8px";
        this.hpBar.style.transform="translateX(-50%)";
        this.hpBar.style.width="24px";
        this.hpBar.style.height="4px";
        this.hpBar.style.border="1px solid black";
        this.hpBar.style.backgroundColor="#444";

        // HPバー中身
        this.hpFill=document.createElement("div");
        this.hpFill.style.width="100%";
        this.hpFill.style.height="100%";
        this.hpFill.style.backgroundColor="lime";

        this.hpBar.appendChild(this.hpFill);
        this.node.appendChild(this.hpBar);
        stage.appendChild(this.node);

        //制御配列に入れる
        StageGridList[this.grid_y][this.grid_x].onEntity.push(this);
        EntityList.push(this);

        //HQなら射程内の通路を勢力下におく
        if(this.type=="HQ"||this.type=="B"){
            for(let i=0;i<=this.Range;i++){
                DEST[i].forEach(offset => {
                    let s=StageGridList[this.grid_y+offset.y][this.grid_x+offset.x];
                    //通路であれば勢力下におく
                    if(s.mode==1){
                        s.faction=this.faction;
                        s.update();
                    }
                });
            }
        }
    }

    update(){
        //ステータス更新
        BattleSystem.BuffCheck(this);

        let damageflag=false;

        //行動を実行
        this.action.call(this);

        //被弾処理
        this.hitList.forEach(bullets=>{
            bullets.wait--;
            //bullets.waitが0になったらダメージ処理
            if(bullets.wait==0){
                //命中処理
                if(BattleSystem.CheckHit(bullets,this)){
                    let damage=BattleSystem.Damage(bullets,this);
                    console.log(this.faction+":hit"+damage);
                    this.CurrentHp-=damage;
                    damageflag=true;
                    if(this.CurrentHp<=0){
                        this.killfaction=bullets.faction;
                    }
                }
                else{
                    console.log(this.faction+"avoid");
                }
            }
        })
        //hpが0なら死亡
        if(this.CurrentHp<=0){
            this.death();
        }
        //ダメージが発生していればHPバーを更新
        else if(damageflag)this.updateHPBar();
        //待ち時間0のhitListを削除
        this.hitList=this.hitList.filter(bullets=>bullets.wait>0);
    }

    //HPバーの更新
    updateHPBar(){
        const rate = Math.max(
            0,
            this.CurrentHp / this.MaxHp
        );

        this.hpFill.style.width = `${rate * 100}%`;

        if(rate > 0.6){
            this.hpFill.style.backgroundColor="lime";
        }
        else if(rate > 0.3){
            this.hpFill.style.backgroundColor="yellow";
        }
        else{
            this.hpFill.style.backgroundColor="red";
        }
    }

    move(){//移動処理
        let dx=(this.route[0].x+0.5)*stage_grid_size;
        let dy=(this.route[0].y+0.5)*stage_grid_size;        
        if(Math.abs(dx-this.x)<this.A_Speed/fps){
            this.x=dx;
        }
        else if(dx>this.x){
            this.x+=this.A_Speed/fps;
        }
        else if(dx<this.x){
            this.x-=this.A_Speed/fps;
        }
        if(Math.abs(dy-this.y)<this.A_Speed/fps){
            this.y=dy;
        }
        else if(dy>this.y){
            this.y+=this.A_Speed/fps;
        }
        else if(dy<this.y){
            this.y-=this.A_Speed/fps;
        }
        if(dx==this.x&&dy==this.y){
            this.grid_x=this.route[0].x;
            this.grid_y=this.route[0].y;
            this.route.shift();
            this.mode="idle";

            if(this.route.length==0) {   
                this.dest=null;
                this.route=null;
            }
        }
        this.node.style.left=this.x+"px";
        this.node.style.top=this.y+"px";
    }
    death(){//死亡処理 
        //スコア加算
        if(this.faction!="our"){
            ScoreSystem.addScore(this.Score);
        }
        //死亡フラグを真に
        this.deathflag=true;

        //DOMを消去
        this.node.remove();

        //所在マスのonEntityから自分を削除
        StageGridList[this.grid_y][this.grid_x].onEntity=StageGridList[this.grid_y][this.grid_x].onEntity.filter(e=>e!=this);



        if(this.name=="司令部"){
            //自陣の司令部が破壊される
            if(this.faction=="our"&&lossflag1){
                alert("GAME OVER!");
                stopflag=true;
            }
            //敵陣司令部が破壊される
            else if(this.faction!="our"&&this.faction!="neutral"&&winflag1){
                alert("GAME CLEAR!!")
                stopflag=true;
            }
            //倒された場所に新しくkillfactonの司令部を生成
            else{
                let newmode=getGridModeIndex("司令部",this.killfaction);
                StageGridList[this.grid_y][this.grid_x].change(newmode);
                new Entity(this.grid_x,this.grid_y,"HQ",this.killfaction,"Building");
            }
            //現在のマスを宛先にするすべてのノードの宛先とルートを消去
            PathfindSystem.clearRoute(this.grid_x,this.grid_y);
        }
        else if(this.name=="飛行場"){
            let newmode=getGridModeIndex("飛行場",this.killfaction);
            StageGridList[this.grid_y][this.grid_x].change(newmode);
            new Entity(this.grid_x,this.grid_y,"H",this.killfaction,"Building");
            //現在のマスを宛先にするすべてのノードの宛先とルートを消去
            PathfindSystem.clearRoute(this.grid_x,this.grid_y);
        }
        else if(this.name=="前線基地"){
            let newmode=getGridModeIndex("前線基地",this.killfaction);
            StageGridList[this.grid_y][this.grid_x].change(newmode);
            new Entity(this.grid_x,this.grid_y,"B",this.killfaction,"Building");
            //現在のマスを宛先にするすべてのノードの宛先とルートを消去
            PathfindSystem.clearRoute(this.grid_x,this.grid_y);
        }
    }
}
function summonEntity(grid_x,grid_y,type,faction,actionmode){
    if(EntityType[type].cost>ScoreSystem.GameCost){
        console.alert("コストが足りません");
        return ;
    }
    else{
        ScoreSystem.GameCost-=EntityType[type].cost;
        new Entity(grid_x,grid_y,type,faction,actionmode);
    }
}