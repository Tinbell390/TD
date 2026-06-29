//敵生成システム

const EnemySystem={
    EnemySummonHG(x,y,faction){
        const summonwait=30;
        //HG 3体
        if(gametime%(summonwait*fps)==0||gametime%(summonwait*fps)==fps/2||gametime%(summonwait*fps)==fps){
            new Entity(x,y,"HG",faction,"Suppress");
        }
    }
}