//スキルに関するjs

const SkillType={
    FireOrder:{
        name:"火力号令",
        skilltime:12,
        keeptime:8,
        //周囲3マスに火力+30%
        skillaction(this_){
            for(let i=this.Range;i>0;i--){

                for(let d of DEST[i]){
                    let nx=this_.grid_x+d.x;
                    let ny=this_.grid_y+d.y;
                    if(nx < 0 ||ny < 0 ||ny >= StageGridList.length ||nx >= StageGridList[0].length){
                        continue;
                    }
                    let targetlist =StageGridList[ny][nx].onEntity;
                    targetlist =targetlist.filter(entity =>entity.faction==this.faction);
                    targetlist.forEach(entity=>{
                        entity.addbuff("attack",30,this.keeptime);
                    })
                }

            }
        }

    }
}