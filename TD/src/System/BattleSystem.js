//戦闘システムをまとめるjs



class attacklog{
    constructor(A_Attack,A_Penetrat,A_Accuracy,faction,wait,BAflag){
        this.A_Attack=A_Attack;
        this.A_Penetrat=A_Penetrat;
        this.A_Accuracy=A_Accuracy;
        this.faction=faction;
        this.BAflag=BAflag;
        this.wait=wait;
    }
    static shotwait=3;
    static slashwait=2;
}

class buff{
    constructor(state,rate,lifetime){
        this.state=state;
        this.rate=rate;
        this.lifetime=lifetime*fps;
    }
}

const StateList=[
    "Attack",
    "Accuracy",
    "Dodge",
    "FireRate",
    "Armor",
    "Penetrat",
    "Speed",
    "Critical",
    "CriticalDMG"
]

const BattleSystem={
    //命中判定
    CheckHit(bullets,this_){
        const hitRate = bullets.A_Accuracy / (bullets.A_Accuracy + this_.A_Dodge);
        return Math.random() < hitRate;
    },
    //射速から待機時間を返す
    ShotWait(A_FireRate){
        return Math.floor(1500/A_FireRate);
    },
    //ダメージ計算
    Damage(bullets,this_){
        //0.85~1.15のゆらぎ
        let damage=bullets.A_Attack*(0.85 + Math.random() * 0.30);
        if(this_.Critical/100>Math.random()){
            console.log("Critical");
            damage=damage*this_.CriticalDMG;
        }
        if(this_.Category=="building"&&bullets.BAflag){
            damage*=3;
            console.log("building special attack")
        }
        if(this_.A_Armor>0){
            damage=Math.max(damage-Math.max(this_.A_Armor-bullets.A_Penetrat,-2),1);
        }

        return Math.floor(damage);
    },
    //バフ処理
    BuffCheck(this_){
        //バフ時間をデクリメント
        this_.buffList.forEach(buffs => {
            buffs.lifetime--;
        });
        //バフ時間0以下を消去
        this_.buffList=this_.buffList.filter(b=>{b.lifetime>0});
        //バフをクリア
        StateList.forEach(states=>{
            this_[`A_${states}`]=this_[`B_${states}`];
        })
        //バフ補正
        this_.buffList.forEach(buffs => {
            this_[`A_${buffs.state}`]*=(1+buffs.rate/100);
        });
    }
}