
var WIDTH;
var HEIGHT;
var canvas;
var con;
var g;
var rint = 40;
var stars;
var delay = true;
var counter = 0;

var MAX_DISTANCE = 100;
var SPEED = 0.8;
var DENSITY = .3;
var SMALLEST_SIZE = 4;
var LARGEST_SIZE = 8;

var SPACING = 15.0;
var CLUSTER_COUNT_INITIAL = 10;
  
setInterval(function () {
  ++counter;
  if (counter > 0) {
  	delay = false;
  }
}, 1000);

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
                              
var pxs = [];

$(document).ready(function(){

  bang(); // creating life

  $( window ).resize(function() {
    WIDTH = $('#space').width();
    $(canvas).attr('width', WIDTH).attr('height',WIDTH);
    stars = WIDTH * DENSITY;
  });
  
  //*********cluster movement***********
  
  var snagged = null;
  
  $(window).on('mousedown touchstart', function(data){
    
    data.preventDefault();
    
    if(data.type == "touchstart"){
      var touch = data.originalEvent.touches[0] || data.originalEvent.changedTouches[0];
      
      snagged = getCluster(touch.clientX, touch.clientY);
      
      if(snagged){
        console.dir(snagged);
      }
      
      return;
    }
    
    if(data.shiftKey){
      
      removeCenter(data.clientX, data.clientY);
      
    }else if(data.ctrlKey){
      
      addCenter(data.clientX, data.clientY);
      
    }else{
      
      snagged = getCluster(data.clientX, data.clientY);
      if(snagged){
        console.dir(snagged);
      }
      
    }
  });
  
  $(window).on('mousemove touchmove', function(data){
    
    data.preventDefault();
    
    if(data.type == "touchmove"){
      var touch = data.originalEvent.touches[0] || data.originalEvent.changedTouches[0];
      data
      
      data.clientX = touch.clientX;
      data.clientY = touch.clientY;
    }
    
    if(snagged){
      snagged.center = [data.clientX, data.clientY];
    }
  });
  
  $(window).on('mouseup touchend', function(data){
    
    data.preventDefault();
    snagged = null;
  })
  
  //*********cluster movement***********
  
});



function bang() {
  WIDTH = $('#space').width();
  HEIGHT = $('#space').height();
  
  canvas = document.getElementById('space-content');
  $(canvas).attr('width', WIDTH).attr('height',HEIGHT);
  
  for(var i = 0 ; i < CLUSTER_COUNT_INITIAL ; i++){
    clusters.push(new Cluster());
  }
  
  con = canvas.getContext('2d');
  
  createUniformGrid();
  
  //createStars();
  
}

var createUniformGrid = function(){
  wstep = WIDTH / SPACING;
  hstep = HEIGHT / SPACING;
  for(var i = 0 ; i < WIDTH; i += SPACING ){
    for (var j = 0 ; j < HEIGHT ; j+=SPACING){
      pxs.push(new Body());
      pxs[pxs.length-1].createGridPoint(i, j);
    }
  }
  draw();
};

var createStars = function(){
  stars = WIDTH * DENSITY;
  for(var i = 0; i < stars; i++) {
    pxs[i] = new Body();
  }
  draw();
};
//for kmeans,
// first group points,
// then calculate new center (avgX, avgY);
// then move

var clusters = [];

function cluster(){
  
  var min, dis, assignToIndex;
  clusters.forEach(function(cluster){
    cluster.bodies = [];
  });
  //assign step
  for(var i = 0 ; i < pxs.length ; i++){
    
    min = 1e6;
    assignToIndex = -1;
    for(var j = 0 ; j < clusters.length ; j++){
      
      dis = getDistance(pxs[i], clusters[j]);
      
      if(dis < min){
        min = dis;
        assignToIndex = j;
      }
    }
    clusters[assignToIndex].addBody(pxs[i]);
  }
  
  //move step
  for(var i = 0 ; i < clusters.length ; i++){
    clusters[i].move();
  }

};

function draw() {
  con.clearRect(0,0,WIDTH,HEIGHT);
  cluster();
  //for(var i = 0; i < pxs.length; i++) {
    //pxs[i].move();
   //pxs[i].draw();
    // for(var j = 0 ; j < pxs.length; j++){
    //   if(j===i) continue;
    //   var dis = getDistance(pxs[i], pxs[j]);
    //   if(dis <= MAX_DISTANCE)
    //     connect(pxs[i], pxs[j], 1-dis/MAX_DISTANCE);
    // }
  //}
  
  for(var i = 0; i < clusters.length; i++) {
    clusters[i].draw();
  }
  window.requestAnimationFrame(draw);
};

function Cluster(){
  this.center = [Math.random()*WIDTH, Math.random()*HEIGHT];
  this.bodies = [];
  
  this.color = 'rgb('+ ~~(Math.random()*255) +','+~~(Math.random()*255) +','+ ~~(Math.random()*255) +')';
  
  var r = 10,
  hull = new ConvexHull();
  
  this.getX = function() { return this.center[0]; }
  this.getY = function() { return this.center[1]; }
  this.getR = function() { return r; }
  
  this.move = function(){
    var newCenter = getAverages(this.bodies);
    this.center = newCenter;
  };
  
  this.addBody = function(body){
    body.cluster = this;
    this.bodies.push(body);
  };
  
  
  this.draw = function(){
    
  	hull.compute(this.bodies);
  	var indices = hull.getIndices();
  	
    con.beginPath();
    con.strokeStyle = this.color;
    con.lineWidth = 1;
    if (indices && indices.length>0) {
  		con.moveTo(this.bodies[indices[0]].getX(), this.bodies[indices[0]].getY());
  		for (var i=1; i<indices.length; i++) {
  			con.lineTo(this.bodies[indices[i]].getX(),this.bodies[indices[i]].getY());
  		}
  		
    }
    
    con.fillStyle = this.color;
    r = this.bodies.length*5;
  // con.shadowColor   = 'rgba(226,225,142,1)';
    //con.rect(this.getX() - r, this.getY() - r, r, r);
    
    con.stroke();
    //con.closePath();
    con.fill();
    
  };
  
  if(arguments.length == 2){
    this.center = [arguments[0], arguments[1]];
  }
  
};

function Body() {
  var r, dx, dy, dr, opacity;
  
  this.cluster = undefined;
  
  this.createBug = function(){
    
  	this.x = (WIDTH*Math.random());
  	this.y = (HEIGHT*Math.random());
  	r = getRandomIn(SMALLEST_SIZE, LARGEST_SIZE);
  	planet = false;
  	dx = (Math.random() > 0.5 ? -1 : 1) * Math.random() * SPEED;
  	dy = (Math.random() > 0.5 ? -1 : 1) * Math.random() * SPEED;
  	dr = 0;
  	opacity = 1;
  };
  
  this.createGridPoint = function(i, j){
    this.x = i;
    this.y = j;
    r = 5;
    dx = 0;
    dy = 0;
  };
  
  this.reset = function() {
      this.createBug();
  };
  
  this.draw = function() {
    
    con.beginPath();
    
    if(this.cluster){
      con.fillStyle = this.cluster.color;
    }else{
      con.fillStyle = 'rgba(226,225,142,'+opacity+')';
    }
    con.shadowColor   = 'rgba(226,225,142,1)';
    con.arc(this.x - r, this.y - r, r, 0, 2 * Math.PI, false);
    
    con.closePath();
    con.shadowOffsetX = 0;
    con.shadowOffsetY = 0;
    con.shadowBlur    = 10;
    con.fill();
    
  };
  
  this.move = function() {
    this.x += dx;
    this.y += dy;
    r += dr;
    if(r <= 0 || r > 30)
      opacity-=0.025;
    if(this.x > WIDTH || this.x < 0 || opacity <= 0 || r <= 0)
      dx*=-1;
    if(this.y > HEIGHT || this.y < 0)
      dy*=-1;
  };
  
  this.getX = function() { return this.x; }
  this.getY = function() { return this.y; }
  this.getR = function() { return r; }
  
  this.reset();
};

//**************** UTILITIES **************

var addCenter = function(x, y){
  clusters.push(new Cluster(x, y));
};

var removeCenter = function(x, y){
  var index = clusters.indexOf(getCluster(x, y));
  if(index != -1){
    clusters.splice(index, 1);
  }
};

var getCluster = function(x, y){
  for (var i = 0 ; i < this.clusters.length ; i++){
    if(Math.abs(this.clusters[i].getX() - x) <= 50 && Math.abs(this.clusters[i].getY() - y) <= 50){
      return this.clusters[i];
    }
  }
  
};

var getRandomIn = function(bottom, top){
  return bottom + (Math.random())*(top - bottom);
};

var getDistance = function(current, other){
  return Math.sqrt(
    Math.pow(other.getX() - current.getX(), 2) +
    Math.pow(other.getY() - current.getY(), 2)
    );
};

var getAverages = function(bugs){
  var sums = bugs.reduce(function(sums, current){
    sums[0]+=current.getX();
    sums[1]+=current.getY();
    return sums;
  }, [0,0]);
  return [sums[0]/bugs.length, sums[1]/bugs.length];
};

var connect = function(bug1, bug2, opacity){
  
  con.beginPath();
  
  con.lineWidth = 1;
  con.strokeStyle =  bug1.cluster.color;
  con.moveTo(bug1.getX() - bug1.getR(), bug1.getY() - bug1.getR());
  con.lineTo(bug2.getX() - bug2.getR(), bug2.getY() - bug2.getR());
  con.stroke();
  
  con.closePath();
};