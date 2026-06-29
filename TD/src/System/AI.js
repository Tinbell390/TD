const EntityAI={
    Action:{
        Building(){//建物モード
            //何もしない
        },
        Turret(){//タレットモード
            //待機時間があればデクリメントして返す
            if(this.wait>0){
                this.wait--;
                return ;
            }

            //待機状態の処理
            else if(this.mode=="idle"){
                if(this.target){
                    // ターゲットが存在するなら攻撃状態に移行
                    this.mode="attack";
                    return;
                }
                else {
                    //ターゲットが存在しないなら標的を探す
                    this.target=this.search.call(this);

                    //ターゲットが見つかれば終了
                    if(this.target){
                        //待機時間を与える
                        this.wait=Math.floor(BattleSystem.ShotWait(this.A_FireRate)/3);
                    }
                    //ターゲットが見つからなければ射撃間隔だけ待機
                    else{
                        this.wait=BattleSystem.ShotWait(this.A_FireRate);
                    }
                }
            }

            //攻撃モードの処理
            else if(this.mode=="attack"){
                //相手が死亡していれば待機モードに移行
                if(this.target.deathflag){
                    this.target=null;
                    this.mode="idle";
                }
                //相手とのマンハッタン距離が射程より大きいならターゲットをクリアして待機モードへ
                else if(Math.abs(this.grid_x-this.target.grid_x)+Math.abs(this.grid_y-this.target.grid_y)>this.Range){
                    this.target=null;
                    this.mode="idle";
                }
                //そうでなければ攻撃
                else{
                    this.attackaction(this);
                    this.wait=BattleSystem.ShotWait(this.A_FireRate)
                }
                return;
            }
        },
        Assault(){//突撃モード
            //待機時間があればデクリメントして返す
            if(this.wait>0){
                this.wait--;
                return;
            }

        },
        Suppress(){//制圧モード
            //待機時間があればデクリメントして返す
            if(this.wait>0){
                this.wait--;
                return;
            }
            // 待機モードの処理
            else if(this.mode=="idle"){
                if(this.target){
                    // ターゲットが存在するなら攻撃状態に移行
                    this.mode="attack";
                    return;
                }
                else {
                    //ターゲットが存在しないなら標的を探す
                    this.target=this.search.call(this);

                    //ターゲットが見つかれば終了
                    if(this.target){
                        //待機時間を与える
                        this.wait=(this.A_FireRate/this.A_Speed);
                        return ;
                    }
                }

                //標的が見つからなければ経路をもとに移動状態へ
                if(!this.route){
                    //経路がなければ経路探査
                    [this.dest,this.route]=PathfindSystem.Astar({x:this.grid_x,y:this.grid_y},factionList[this.faction].SuppressionTarget);
                    // console.log(this.route)

                    if(!this.route){
                        //探査しても経路が見つからなければ20f待機
                        this.wait=20;
                        return;
                    }
                }
                else{
                    //移動状態へ移行
                    this.mode="move";
                    //現在マス.onEntityに格納された自分のデータを次のマスに移動させる
                    let nowmath=StageGridList[this.grid_y][this.grid_x];
                    //nowmath.onEntityからthisを除外する
                    nowmath.onEntity = nowmath.onEntity.filter(entity => entity !== this);
                    let nextmath=StageGridList[this.route[0].y][this.route[0].x];
                    nextmath.onEntity.push(this);
                }
            }
            //攻撃モードの処理
            else if(this.mode=="attack"){
                if(this.reloadwait>0){
                    this.reloadwait--;
                    return ;
                }
                //ターゲットが配列でない
                if(!Array.isArray(this.target)){               
                     //相手が死亡していれば待機モードに移行
                    if(this.target.deathflag){
                        this.target=null;
                        this.mode="idle";
                    }
                    //相手とのマンハッタン距離が射程より大きければターゲットをクリアして待機モードへ
                    else if(Math.abs(this.grid_x-this.target.grid_x)+Math.abs(this.grid_y-this.target.grid_y)>this.Range){
                        this.target=null;
                        this.mode="idle";
                    }
                    //残弾が0以下ならリロード
                    else if(this.CurrentAmmo<=0&&this.MaxAmmo){
                        this.CurrentAmmo=this.MaxAmmo;
                        this.reloadwait=BattleSystem.ReloadWait(this.MaxAmmo);
                        this.mode="idle";
                    }
                    //そうでなければ攻撃
                    else{
                        this.CurrentAmmo--;
                        this.attackaction(this);
                        this.wait=BattleSystem.ShotWait(this.A_FireRate)
                    }
                    return;
                }
                //ターゲットが配列
                else{             
                    //相手が死亡していれば待機モードに移行
                    if(this.target.some(ta=>ta.deathflag)){
                        this.target=null;
                        this.mode="idle";
                    }
                    //相手とのマンハッタン距離が射程より大きければターゲットをクリアして待機モードへ
                    else if(this.target.some(ta=>Math.abs(this.grid_x-ta.grid_x)+Math.abs(this.grid_y-ta.grid_y)>this.Range)){
                        this.target=null;
                        this.mode="idle";
                    }
                    //残弾が0以下ならリロード
                    else if(this.CurrentAmmo<=0&&this.MaxAmmo){
                        this.CurrentAmmo=this.MaxAmmo;
                        this.reloadwait=BattleSystem.ReloadWait(this.MaxAmmo);
                        this.mode="idle";
                    }
                    //そうでなければ攻撃
                    else{
                        //ターゲットが配列で最大数以下なら標的を探す
                        if(Array.isArray(this.target)&&this.target.length<3){
                            this.target=this.search.call(this);
                        }
                        this.CurrentAmmo--;
                        this.attackaction(this);
                        this.wait=BattleSystem.ShotWait(this.A_FireRate)
                    }
                    return;
                }
            }
            else if(this.mode=="move"){
                this.move();
                return ;
            }
        },
        covering(){//擁護モード

        }
    },
    Search:{
        //最も近い敵をターゲット
        NearTarget(){

            for(let i=1;i<=this.Range;i++){

                for(let d of DEST[i]){
                    let nx=this.grid_x+d.x;
                    let ny=this.grid_y+d.y;
                    if(nx < 0 ||ny < 0 ||ny >= StageGridList.length ||nx >= StageGridList[0].length){
                        continue;
                    }

                    let enemylist =StageGridList[ny][nx].onEntity;

                    enemylist =enemylist.filter(entity =>entity.faction!=this.faction);

                    if(enemylist.length > 0){

                        return enemylist[Math.floor(Math.random()*enemylist.length)];

                    }

                }

            }

            return null;
        },
        //散弾で最も近い敵3体を標的にする
        ScatterTarget(){
            let ta=[];
            for(let i=1;i<=this.Range;i++){
               

                for(let d of DEST[i]){
                    let nx=this.grid_x+d.x;
                    let ny=this.grid_y+d.y;
                    if(nx < 0 ||ny < 0 ||ny >= StageGridList.length ||nx >= StageGridList[0].length){
                        continue;
                    }

                    let enemylist =StageGridList[ny][nx].onEntity;

                    enemylist =enemylist.filter(entity =>entity.faction!=this.faction);

                    enemylist.forEach(e=>{
                        if(ta.length>BattleSystem.ScatterTarget)return;
                        ta.push(e);
                    })

                }

            }
            if(ta.length==0)return null;
            else return ta;
        },
        //最も遠い敵をターゲット
        FarTarget(){

            for(let i=this.Range;i>0;i--){

                for(let d of DEST[i]){
                    let nx=this.grid_x+d.x;
                    let ny=this.grid_y+d.y;
                    if(nx < 0 ||ny < 0 ||ny >= StageGridList.length ||nx >= StageGridList[0].length){
                        continue;
                    }

                    let enemylist =StageGridList[ny][nx].onEntity;

                    enemylist =enemylist.filter(entity =>entity.faction!=this.faction);

                    if(enemylist.length > 0){

                        return enemylist[Math.floor(Math.random()*enemylist.length)];

                    }

                }

            }

            return null;
        }
    },
    Attack:{
        Shot(this_){//通常射撃
            //攻撃予約を標的のhitListに入れる
            let b=new attacklog(this_.A_Attack,this_.A_Penetrat,this_.A_Accuracy,this_.A_Critical,this_.A_CriticalDMG,this_.faction,attacklog.shotwait,false)
            this_.target.hitList.push(b);
            //(thia.x,this.y)から(this.target.x,this.target.y)まで3フレーム(fps=30)で到達する描画
            const bulletss = document.createElement("div");
            bulletss.className = "bullet";
            stage.appendChild(bulletss);

            bulletss.style.transform = `translate(${this_.x}px, ${this_.y}px)`;

            // 初期描画後に移動開始
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {

                    bulletss.classList.add("move");

                    bulletss.style.transform =`translate(${this_.target.x}px, ${this_.target.y}px)`;

                });
            });

            // 到達したら削除
            bulletss.addEventListener("transitionend", () => {
                bulletss.remove();
            }, { once: true });
        },
        Slash(this_){//近接斬撃

            let b = new attacklog(
                this_.A_Attack,
                this_.A_Penetrat,
                this_.A_Accuracy,
                this_.A_Critical,this_.A_CriticalDMG,
                this_.faction,
                attacklog.slashwait,
                true
            );

            this_.target.hitList.push(b);

            const slash = document.createElement("div");
            slash.className = "slash";
            stage.appendChild(slash);

            // 中間座標
            const cx = (this_.x + this_.target.x) / 2;
            const cy = (this_.y + this_.target.y) / 2;

            // 攻撃方向
            const dx = this_.target.x - this_.x;
            const dy = this_.target.y - this_.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            slash.style.left = `${cx}px`;
            slash.style.top = `${cy}px`;
            slash.style.setProperty("--angle", `${angle}deg`);

            setTimeout(()=>{
                slash.remove();
            },(1000/fps)*attacklog.slashwait); // 約3フレーム
        },
        Scatter(this_){//散弾
            //
            let targets=this_.target;//配列
            targets.forEach(ta=>{
                //攻撃予約を標的のhitListに入れる
                let b=new attacklog(this_.A_Attack,this_.A_Penetrat,this_.A_Accuracy,this_.A_Critical,this_.A_CriticalDMG,this_.faction,attacklog.shotwait,false)
                ta.hitList.push(b);
                //(thia.x,this.y)から(this.target.x,this.target.y)まで3フレーム(fps=30)で到達する描画
                const bulletss = document.createElement("div");
                bulletss.className = "bullet";
                stage.appendChild(bulletss);

                bulletss.style.transform = `translate(${this_.x}px, ${this_.y}px)`;
                


                // 初期描画後に移動開始
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        bulletss.classList.add("move");
                        bulletss.style.transform =`translate(${ta.x}px, ${ta.y}px)`;
                    });
                });
                //ノックバック判定と処理
                if(BattleSystem.KnockbackChance/100>Math.random()){
                    BattleSystem.Knockback(this_,ta);
                }
                // 到達したら削除
                bulletss.addEventListener("transitionend", () => {
                    bulletss.remove();
                }, { once: true });
            })

        }
    },
    Undiscoveredwait:20     //経路探査失敗時の待機時間
}