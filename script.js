'use strict';
const width = 10;
const height = 10;
//let grid = ["2.X", "X.H", ".H1"];
//let grid = ["4..XX", ".H.H.", "...H.", ".2..2", "....."];
let grid = [
    "..........",
    "..........",
    "H.H...3..H",
    ".H........",
    ".X.244.2.X",
    "....44...X",
    "....3...H.",
    "..X....H.H",
    "H.X.......",
    "..X......."
]
let drawingBoard = generateDrawingBoard(grid);
let ballPointer = 0;
let ballInHolesCount = 0;
let hotPointer = false;

// incrementare directions
// usare initial hits
// controllare se superato initial hits

class Ball {
    constructor(startIndices, initialHits){
        this.currentSymbol = '>';
        this.arrivalIndicesStack = [startIndices];
        this.startIndices = startIndices;
        this.currentIndices = startIndices;
        this.initialHits = initialHits;
        this.currentHits = 0;
        this.directionsStack = [0];
        this.path = {
            crossedIndicesStack: [[]],
            symbolsStack: [[]],
        }
        this.nextIndices = [0,0];
        this.holeReached = false;
    }

    pathAdd(){
        this.path.crossedIndicesStack.push([]);
        this.path.symbolsStack.push([]);
    }

    switchBallPointer(){
        ballPointer ++;
        if(ballPointer > ballsNumber-1) ballPointer = 0;
    }

    switchBackBallPointer(){
        ballPointer --;
        if(ballPointer<0) ballPointer = ballsNumber-1;
    }

   reset(){
        this.currentSymbol = '>';
        this.arrivalIndicesStack = [this.startIndices];
        this.currentIndices = this.startIndices;
        this.currentHits = 0;
        this.directionsStack = [0];
        this.path = { 
            crossedIndicesStack: [[]],
            symbolsStack: [[]],
        }
        this.nextIndices = [0,0];
        this.holeReached = false;
    } 
    
    findHole(){
        //this.directionsStack.push(0);
        //this.pathAdd();
        while(!this.holeReached){
            if(!this.getHitResult(...this.currentIndices, this.directionsStack[this.currentHits], this.initialHits - this.currentHits)){
                if(!this.changeDirection()) {
                    // CASI:
                    // - la prima direzione dello stack supera il numero massimo di direzioni cioè 4
                    // -> prima di cambiare il pointer resetta il suo stato
                    // ->la ball non sa piu cosa fare, quindi cambia pointer tornando a quello precedente
                    // (pointer precedente per ottimizzare il processo)
                    hotPointer = true;
                    this.reset();
                    this.switchBackBallPointer();
                    return;
                }
            }
            else{
                this.drawToBoard();
                this.currentHits ++;
                this.arrivalIndicesStack.push(this.nextIndices);
                this.changeCurrentIndices();
                if(this.isInHole()) {
                    this.flagHole(...this.currentIndices);
                    console.log('jump in hole');
                    
                }
                else if (this.currentHits< this.initialHits){
                    this.directionsStack.push(0);
                    this.pathAdd();   
                }
                console.log('jump success');
            }

        }
        this.switchBallPointer();
    }

    changeCurrentIndices(){
        this.currentIndices = this.arrivalIndicesStack[this.currentHits];
    }

    isInHole(){
        const i = this.currentIndices[0];
        const j = this.currentIndices[1];
        return grid[i][j] === 'H';
    }

    changeDirection(){
        this.directionsStack[this.currentHits] ++;
        if(this.holeReached){
            this.deflagHole(...this.currentIndices);
        }
        if(this.directionsStack[this.currentHits]>3){
            if(this.currentHits === 0) {
                return false; // valutate tutte le possibilità, reset e pointer indietro
            }
            this.jumpBack();
            return this.changeDirection(); // salto indietro e valuta nuova direzione
        }
        return true; // direzione cambiata
    }

    jumpBack(){
        this.pathPop();
        this.directionsStack.pop();
        this.currentHits --;
        this.eraseBoard();
        this.arrivalIndicesStack.pop();
        this.changeCurrentIndices();
    }

    changeDirectionAndDeflagHotPointer(){
        if(this.holeReached)this.deflagHole(...this.currentIndices);
        if(this.currentHits>0){
            this.currentHits --;
            this.eraseBoard();
            this.pathClearLast();
            this.arrivalIndicesStack.pop();
            this.changeCurrentIndices(); 
            hotPointer = false;
            this.changeDirection();
        }
        
    }

    flagHole(i,j){
        ballInHolesCount++;
        this.holeReached = true;
        const newStr = changeChar(grid[i], j, 'F');
        grid[i] = newStr;
    }

    deflagHole(i,j){
        this.holeReached = false;
        ballInHolesCount --;
        const newStr = changeChar(grid[i], j, 'H');
        grid[i] = newStr;
    }

    getHitResult(i,j,dir,dist){
        if (dist === 0) return false;
        switch(dir){
            case 0:
                this.currentSymbol = '>';
                return j+dist<width && this.horizontalCheck(i,j,dist);
            case 1:
                this.currentSymbol = 'v';
                return i+dist<height && this.verticalCheck(i,j,dist);
            case 2:
                this.currentSymbol = '<';
                return j-dist>-1 && this.horizontalCheck(i,j,-dist);
            case 3:
                this.currentSymbol = '^';
                return i-dist>-1 && this.verticalCheck(i,j,-dist);
        }
    }
    
    horizontalCheck(i,j,dist){
        const sgn = Math.sign(dist);
        for(let k=1; k<=sgn*dist; k++){
            const idx = j+sgn*k;
            if(!this.checkCell(i,idx, sgn*dist - k)){
                this.pathClearLast();
                this.nextIndices = [].concat(this.currentIndices);
                // clear path
                return false;
            }
            this.pathPush([i,idx-sgn], this.currentSymbol);
            this.nextIndices = [i, idx];
            // add to path

        }
        return true;
    }
    
    verticalCheck(i,j,dist){
        const sgn = Math.sign(dist);
        for(let k=1; k<=sgn*dist; k++){
            const idx = i+sgn*k;
            if(!this.checkCell(idx,j, sgn*dist-k)){
                this.pathClearLast();
                this.nextIndices = [].concat(this.currentIndices);
                // clear path
                return false;
            }

            this.pathPush([idx-sgn,j], this.currentSymbol);
            this.nextIndices = [idx, j];
            // add to path

        }
        return true;
    }
    
    checkCell(i,j, k){
        return this.checkDrawingBoard(i,j) && this.checkGrid(i,j, k);
    }
    
    checkDrawingBoard(i,j){
        const element = drawingBoard[i][j];
        if(drawingBoard[i][j].match(/[<v^>]/g)) return false;
        return true;
    }
    
    checkGrid(i,j, k){
        const element = grid[i][j];
        if(grid[i][j].match(/[F0123456789]/g)) return false;
        else if(k === 0) {
            if(this.initialHits -this.currentHits === 1) return !grid[i][j].match(/[X.]/g);
            else return !grid[i][j].match(/[X]/g);
        }
        return true;
    }
    

    pathPush(indices, symbol){

        this.path.crossedIndicesStack[this.currentHits].push(indices);
        this.path.symbolsStack[this.currentHits].push(symbol);
    }

    pathClearLast(){
        this.path.crossedIndicesStack[this.currentHits] = [];
        this.path.symbolsStack[this.currentHits] = [];
    }

    pathPop(){
        this.path.crossedIndicesStack.pop();
        this.path.symbolsStack.pop();
    }

    drawToBoard(){
        this.path.crossedIndicesStack[this.currentHits].forEach((indices, i )=> {
            const newStr = changeChar(drawingBoard[indices[0]],indices[1], this.path.symbolsStack[this.currentHits][i]);
            drawingBoard[indices[0]] = newStr;
        })
    }

    eraseBoard(){
        this.path.crossedIndicesStack[this.currentHits].forEach(indices=> {
            const newStr = changeChar(drawingBoard[indices[0]],indices[1], '.');
            drawingBoard[indices[0]] = newStr;
        });
    }

}

function changeChar(str, index, newChar){
    return str.slice(0, index) + newChar + str.slice(index+1, str.length);
}

function findAllBalls (grid){
    let ballsInfo = [];
    for (let i = 0; i< grid.length; i++){
        for(let j = 0; j<grid[i].length; j++){
            if(grid[i][j].match(/^[0-9]*$/)!== null){
                let ball = new Ball([i,j],Number(grid[i][j]));
                ballsInfo.push(ball);
            }  
        }
    }
    return ballsInfo;
}

function generateDrawingBoard(grid){
    let table = grid.map(value=>value.replace(/[XH0123456789]/g, "."));
    return table;
}

const ballsInfo = findAllBalls(grid);
const ballsNumber = ballsInfo.length;

function solve(){
    while(ballInHolesCount<ballsNumber){
        if(hotPointer) {
            ballsInfo[ballPointer].changeDirectionAndDeflagHotPointer();
        }
        ballsInfo[ballPointer].findHole();

    }
}

solve();
console.log(drawingBoard);
