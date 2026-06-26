const PathfindSystem = {
    //A*アルゴリズム
    //start={x:開始地点のgrid_x,y:開始地点のgrid_y}
    //targetList=[探査するマスの番号]
    Astar(start, targetList){

        function isGoal(x,y){
            return targetList.includes(
                StageGridList[y][x].mode
            );
        }

        function heuristic(x,y){

            let min = Infinity;

            for(let gy=0; gy<StageGridList.length; gy++){

                for(let gx=0; gx<StageGridList[gy].length; gx++){

                    if(
                        targetList.includes(
                            StageGridList[gy][gx].mode
                        )
                    ){

                        const d =
                            Math.abs(x-gx)
                            +
                            Math.abs(y-gy);

                        if(d < min){
                            min = d;
                        }
                    }
                }
            }

            return min;
        }

        const open = [];
        const close = [];

        open.push({
            x:start.x,
            y:start.y,
            g:0,
            h:heuristic(start.x,start.y),
            f:0,
            parent:null
        });

        while(open.length > 0){

            open.sort((a,b)=>a.f-b.f);

            const current = open.shift();

            if(isGoal(current.x,current.y)){

                return [
                    {
                        x:current.x,
                        y:current.y
                    },
                    this.createPath(current)
                ];
            }

            close.push(current);

            const dirs = [
                {x:1,y:0},
                {x:-1,y:0},
                {x:0,y:1},
                {x:0,y:-1}
            ];

            for(const d of dirs){

                const nx = current.x + d.x;
                const ny = current.y + d.y;

                if(
                    nx < 0 ||
                    ny < 0 ||
                    ny >= StageGridList.length ||
                    nx >= StageGridList[0].length
                ){
                    continue;
                }

                const grid = StageGridList[ny][nx];

                if(!grid.pass){
                    continue;
                }

                if(
                    close.some(
                        n => n.x===nx && n.y===ny
                    )
                ){
                    continue;
                }

                const newG = current.g + 1;

                let node = open.find(
                    n => n.x===nx && n.y===ny
                );

                if(!node){

                    node = {
                        x:nx,
                        y:ny,
                        g:newG,
                        h:heuristic(nx,ny),
                        parent:current
                    };

                    node.f = node.g + node.h;

                    open.push(node);
                }

                else if(newG < node.g){

                    node.g = newG;
                    node.f = node.g + node.h;
                    node.parent = current;
                }
            }
        }
        return [null,null];
    },

    createPath(node){

        const path = [];

        while(node){

            path.push({
                x:node.x,
                y:node.y
            });

            node = node.parent;
        }

        return path.reverse();
    },

    randomRoute(start){

        const nextlist = [];

        for(const m of DEST[1]){

            const nx = start.x + m.x;
            const ny = start.y + m.y;

            if(
                nx < 0 ||
                ny < 0 ||
                ny >= StageGridList.length ||
                nx >= StageGridList[0].length
            ){
                continue;
            }

            const grid = StageGridList[ny][nx];

            if(grid.pass){
                nextlist.push({
                    x:nx,
                    y:ny
                });
            }
        }

        if(nextlist.length === 0){
            return null;
        }

        return nextlist[
            Math.floor(Math.random()*nextlist.length)
        ];
    },
    clearRoute(grid_x,grid_y){
        //引数を宛先とするすべての兵士ノードの宛先とルートを初期化
        EntityList.forEach(e=>{
            if(e.dest==null){
                return;
            }
            else if(e.dest.x==grid_x&&e.dest.y==grid_y){
                e.dest=null;
                e.route=null;
                e.mode="idle"
            }
        })
    }
};