const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){ 
  canvas.width=window.innerWidth; 
  canvas.height=window.innerHeight; 
}
window.addEventListener('resize', resizeCanvas); 
resizeCanvas();

const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
const fontSize=20;
const columns=Math.floor(canvas.width/fontSize);
let drops=Array.from({length:columns},()=>Math.random()*canvas.height);
let trails = Array.from({length:columns},()=>[]);

function drawMatrix(){
  ctx.fillStyle="rgba(0,0,0,0.04)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font=fontSize+"px monospace";

  for(let i=0;i<columns;i++){
    const text=letters.charAt(Math.floor(Math.random()*letters.length));
    let yPos=drops[i]*fontSize;

    trails[i].push({char:text, y:yPos, brightness:255});
    if(trails[i].length>20) trails[i].shift();

    trails[i].forEach(t=>{
      ctx.fillStyle=`rgb(0,${t.brightness},0)`;
      ctx.fillText(t.char,i*fontSize,t.y);
      t.brightness = Math.max(50,t.brightness-12);
    });

    if(yPos>canvas.height && Math.random()>0.975){ 
      drops[i]=0; 
      trails[i]=[]; 
    }
    drops[i]++;
  }
}

setInterval(drawMatrix,40);
