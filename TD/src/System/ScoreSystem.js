//戦闘システムをまとめるjs

const ScoreSystem={
    GameScore:0,                //ゲーム全体のスコア
    ScoreCounter:0,             //1フレーム毎のスコア
    GameCost:0,                 //ゲーム全体の使用可能コスト
    CostCounter:0,              //1フレーム毎の取得コスト
    CostRate:1000,
    //スコア獲得関数
    addScore(point){
        ScoreSystem.ScoreCounter+=point;
    },
    //
    //スコアカウンタからコストを算出してゲームスコアを更新する関数
    CheckScore(){
        ScoreSystem.CostCounter+=ScoreSystem.ScoreCounter;
        ScoreSystem.GameScore+=ScoreSystem.ScoreCounter;
        ScoreSystem.GameCost+=Math.floor(ScoreSystem.CostCounter/ScoreSystem.CostRate);
        ScoreSystem.CostCounter=ScoreSystem.CostCounter%ScoreSystem.CostRate;
        ScoreSystem.ScoreCounter=0;
    },
    //コスト消費関数
    CostExpenditure(expenses){
        //消費が現在の所持コストより大きければ偽を返す
        if(ScoreSystem.GameCost<expenses)return false;
        //消費が現在の所持コストより小さければコストを消費して真を返す
        else{
            ScoreSystem.GameCost=ScoreSystem.GameCost-expenses;
            return true;
        }
    },
    Cooperate(){
        let addcost=0;
        EntityList.forEach(e=>{
            if(e.faction=="our"){
                if(e.name=="司令部") addcost+=2;
                else if(e.name=="飛行場") addcost++;
                else if(e.name=="前線基地") addcost++;
            }
        })
        ScoreSystem.GameCost+=addcost;
    }

}