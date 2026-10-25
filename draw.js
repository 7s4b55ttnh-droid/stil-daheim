/* Stil-Daheim – Raum-Rechner: Rechenregeln und Maßzeichnungen.
   Alle Längen in Zentimetern. Die Faustregeln stehen gesammelt in R und sind auf der Seite mit Quellen belegt. */
(function(){
'use strict';
var TAG='{{TAG}}';
var R={
  rugSizes:[[160,230],[200,300],[240,340],[300,400]],   /* gängige Teppichgrößen */
  roundSizes:[160,200,240,300],
  livingSide:15,      /* Teppich steht links und rechts mindestens so weit über das Sofa hinaus */
  livingUnder:20,     /* so weit liegt der Teppich unter dem Sofa (vordere Füße darauf) */
  sofaDepth:95, tableGap:45, tableDepth:60, tableShare:0.55,   /* Couchtisch halb bis zwei Drittel so lang wie das Sofa, 40 bis 50 cm Abstand */
  diningEdge:70,      /* Teppich rund um den Esstisch, damit Stühle beim Zurückschieben draufbleiben */
  bedSide:60,         /* sichtbarer Teppich links und rechts vom Bett */
  bedFront:60,        /* sichtbarer Teppich am Fußende */
  rodSide:20,         /* Gardinenstange je Seite breiter als das Fenster */
  rodAbove:15,        /* Stange über der Fensteroberkante */
  ceilingGap:5,       /* mindestens Platz unter der Decke für Träger */
  floorGap:2,         /* bodenlange Vorhänge enden knapp über dem Boden */
  fullness:1.5,       /* Stoffbreite = Stangenlänge x Faktor: Ösen 1,5, Kräusel- oder Smokband 2 */
  panelWidth:140,     /* übliche Schalbreite */
  picCenter:150,      /* Bildmitte über dem Boden */
  picGap:20,          /* Abstand Unterkante Bild zur Sofalehne */
  picGapBoard:15,     /* Abstand Unterkante Bild zum Sideboard */
  lampAbove:function(room){return room<250?60:room<=270?65:70},   /* Unterkante über der Tischplatte, 60 bis 80 cm */
  paintYield:6,       /* m² je Liter und Anstrich, steht auf dem Eimer */
  door:[90,200], window:[120,120], sill:90,
  rollLen:{53:1005,106:1000}, rollAdd:10
};
var NS='http://www.w3.org/2000/svg';
function f(n,d){d=d||0;return n.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d})}
function cm(n){return f(Math.round(n))+' cm'}
function E(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
/* Schriftgröße in Zeichnungs-Einheiten: am Handy größer, damit Maße lesbar bleiben */
var FS=15;
function prep(box){var cw=box.clientWidth||640;FS=Math.max(15,Math.round(12.5*640/cw))}
function svg(box,W,H){box.innerHTML='';var s=E('svg',{viewBox:'0 0 '+W+' '+H,'aria-hidden':'true',focusable:'false'},box);s.style.fontSize=FS+'px';return s}
function tw(s){return s.length*FS*0.54+FS*0.9}
function lab(g,x,y,s){var w=tw(s),h=FS*1.5;E('rect',{x:x-w/2,y:y-h/2,width:w,height:h,rx:3,'class':'d-bg'},g);var t=E('text',{x:x,y:y+FS*0.35,'text-anchor':'middle'},g);t.textContent=s;return t}
function tk(g,x,y){var t=Math.max(5,FS/3);E('line',{x1:x-t,y1:y+t,x2:x+t,y2:y-t,'class':'tk'},g)}
/* waagerechte Maßlinie mit Hilfslinien von a (bei x1) und b (bei x2) */
function dimH(s,x1,x2,y,txt,a,b,pos){var g=E('g',{'class':'d-dim'},s);
  if(a!=null)E('line',{x1:x1,y1:a,x2:x1,y2:y+(y>a?7:-7)},g);
  if(b!=null)E('line',{x1:x2,y1:b,x2:x2,y2:y+(y>b?7:-7)},g);
  E('line',{x1:x1,y1:y,x2:x2,y2:y},g);tk(g,x1,y);tk(g,x2,y);
  if(txt){var span=Math.abs(x2-x1),w=tw(txt);
    if(span>w+14)lab(g,(x1+x2)/2,y,txt);
    else if(pos==='left')lab(g,Math.min(x1,x2)-w/2-8,y,txt);
    else if(pos==='right')lab(g,Math.max(x1,x2)+w/2+8,y,txt);
    else lab(g,(x1+x2)/2,y+(pos==='above'?-1.4:1.4)*FS,txt)}
  return g}
/* senkrechte Maßlinie, Text waagerecht */
function dimV(s,y1,y2,x,txt,a,b,pos){var g=E('g',{'class':'d-dim'},s);
  if(a!=null)E('line',{x1:a,y1:y1,x2:x+(x>a?7:-7),y2:y1},g);
  if(b!=null)E('line',{x1:b,y1:y2,x2:x+(x>b?7:-7),y2:y2},g);
  E('line',{x1:x,y1:y1,x2:x,y2:y2},g);tk(g,x,y1);tk(g,x,y2);
  if(txt){var span=Math.abs(y2-y1),w=tw(txt);
    if(pos==='right')lab(g,x+w/2+8,(y1+y2)/2,txt);
    else if(pos==='left')lab(g,x-w/2-8,(y1+y2)/2,txt);
    else if(span>30)lab(g,x,(y1+y2)/2,txt);
    else lab(g,x+w/2+8,(y1+y2)/2,txt)}
  return g}
function text(s,x,y,t,anchor){var e=E('text',{x:x,y:y,'class':'d-lbl','text-anchor':anchor||'start'},s);e.textContent=t;return e}
function amz(q,label){return '<a href="https://www.amazon.de/s?k='+encodeURIComponent(q).replace(/%20/g,'+')+'&amp;tag='+TAG+'" rel="sponsored nofollow noopener" target="_blank">'+label+'</a><span class="tag">Anzeige</span>'}
function oops(box,msg){prep(box);var s=svg(box,640,260);var g=E('g',{'class':'d-dim'},s);E('line',{x1:200,y1:120,x2:440,y2:120},g);tk(g,200,120);tk(g,440,120);lab(g,320,120,'?');text(s,320,190,msg,'middle');return s}
function check(msg){return '<span class="big">Bitte Maße prüfen</span>'+msg}
function pick(sizes,needL,needS){for(var i=0;i<sizes.length;i++){if(sizes[i][1]>=needL&&sizes[i][0]>=needS)return sizes[i]}return null}

/* ---------- Teppich ---------- */
function sofaTop(s,x,y,w,d){ /* Sofa von oben */
  E('rect',{x:x,y:y,width:w,height:d,rx:6,'class':'d-obj'},s);
  var arm=Math.min(d*0.24,w*0.12),back=d*0.24;
  E('rect',{x:x,y:y,width:arm,height:d,rx:5,'class':'d-soft'},s);E('rect',{x:x+w-arm,y:y,width:arm,height:d,rx:5,'class':'d-soft'},s);
  E('rect',{x:x+arm,y:y,width:w-2*arm,height:back,'class':'d-soft'},s);
  var n=w>180?3:2,cw=(w-2*arm)/n;for(var i=1;i<n;i++)E('line',{x1:x+arm+cw*i,y1:y+back,x2:x+arm+cw*i,y2:y+d,'class':'d-line'},s)}
function living(box,o){
  prep(box);
  var S=o.sofa,need=S+2*R.livingSide,size=pick(R.rugSizes,need,R.livingUnder+R.tableGap+R.tableDepth+30)||R.rugSizes[R.rugSizes.length-1];
  var RL=size[1],RS=size[0],TL=Math.round(S*R.tableShare/10)*10;
  var W=640,H=430,ml=Math.max(40,FS*3),mr=Math.max(120,FS*6),mt=Math.max(58,FS*3.6),mb=Math.max(70,FS*4);
  var extW=Math.max(RL,S),extH=R.sofaDepth-R.livingUnder+RS;
  var k=Math.min((W-ml-mr)/extW,(H-mt-mb)/extH);
  var ox=ml+((W-ml-mr)-extW*k)/2,oy=mt;
  var s=svg(box,W,H);
  var rx=ox+(extW-RL)/2*k,ry=oy+(R.sofaDepth-R.livingUnder)*k,sx=ox+(extW-S)/2*k;
  E('rect',{x:rx,y:ry,width:RL*k,height:RS*k,rx:3,'class':'d-rug'},s);
  sofaTop(s,sx,oy,S*k,R.sofaDepth*k);
  var tx=sx+(S-TL)/2*k,ty=oy+(R.sofaDepth+R.tableGap)*k;
  E('rect',{x:tx,y:ty,width:TL*k,height:R.tableDepth*k,rx:4,'class':'d-obj'},s);
  var tl=tw('Couchtisch')<TL*k-10?'Couchtisch':tw('Tisch')<TL*k-8?'Tisch':'';if(tl)text(s,tx+TL*k/2,ty+R.tableDepth*k/2+5,tl,'middle');
  dimH(s,sx,sx+S*k,oy-24,'Sofa '+cm(S),oy,oy);
  dimH(s,rx,rx+RL*k,ry+RS*k+30,'Teppich '+cm(RL),ry+RS*k,ry+RS*k);
  dimV(s,ry,ry+RS*k,rx+RL*k+28,cm(RS),rx+RL*k,rx+RL*k,'right');
  var side=(RL-S)/2;
  if(side>0)dimH(s,rx,sx,ry-18,cm(side),null,null,'left');
  var html='<span class="big">'+RS+' × '+RL+' cm</span>Dein Sofa ist '+cm(S)+' breit. Mit diesem Teppich stehen links und rechts je '+cm(side)+' über, und die vorderen Sofafüße stehen darauf. '+amz('Teppich '+RS+'x'+RL,'Teppiche '+RS+' × '+RL+' cm ansehen');
  return {size:size,html:html}}
function dining(box,o){
  prep(box);
  var round=o.shape==='round',L=round?o.D:o.L,B=round?o.D:o.B,e=R.diningEdge,size,RL,RS,dia=0,custom=false;
  if(round){for(var i=0;i<R.roundSizes.length;i++){if(R.roundSizes[i]>=L+2*e){dia=R.roundSizes[i];break}}if(!dia){custom=true;dia=Math.ceil((L+2*e)/10)*10}RL=RS=dia}
  else{size=pick(R.rugSizes,L+2*e,B+2*e);if(!size){custom=true;size=[Math.ceil((B+2*e)/10)*10,Math.ceil((L+2*e)/10)*10]}RL=size[1];RS=size[0]}
  var W=640,H=430,ml=Math.max(40,FS*3),mr=Math.max(120,FS*6),mt=Math.max(40,FS*2.6),mb=Math.max(70,FS*4.4);
  var k=Math.min((W-ml-mr)/RL,(H-mt-mb)/RS);
  var ox=ml+((W-ml-mr)-RL*k)/2,oy=mt+((H-mt-mb)-RS*k)/2;
  var s=svg(box,W,H),cx=ox+RL*k/2,cy=oy+RS*k/2;
  if(round)E('circle',{cx:cx,cy:cy,r:dia*k/2,'class':'d-rug'},s);else E('rect',{x:ox,y:oy,width:RL*k,height:RS*k,rx:3,'class':'d-rug'},s);
  var ch=45*k;
  if(round){var n=Math.max(4,Math.round(Math.PI*L/60));for(var j=0;j<n;j++){var a=j/n*2*Math.PI,r=(L/2+30)*k;var g=E('g',{transform:'translate('+(cx+Math.cos(a)*r)+','+(cy+Math.sin(a)*r)+') rotate('+(a*180/Math.PI+90)+')'},s);E('rect',{x:-ch/2,y:-ch/2,width:ch,height:ch,rx:4,'class':'d-soft'},g)}
    E('circle',{cx:cx,cy:cy,r:L/2*k,'class':'d-obj'},s)}
  else{var nn=Math.max(1,Math.floor(L/60));for(var q=0;q<nn;q++){var px=cx-L*k/2+(L*k/nn)*(q+.5);
      E('rect',{x:px-ch/2,y:cy-B*k/2-ch-4,width:ch,height:ch,rx:4,'class':'d-soft'},s);E('rect',{x:px-ch/2,y:cy+B*k/2+4,width:ch,height:ch,rx:4,'class':'d-soft'},s)}
    E('rect',{x:cx-L*k/2,y:cy-B*k/2,width:L*k,height:B*k,rx:3,'class':'d-obj'},s)}
  var tlab=round?'Tisch Ø '+cm(L):'Tisch';if(tw(tlab)<L*k*0.92)text(s,cx,cy+5,tlab,'middle');else if(round)text(s,cx,Math.max(FS,oy-FS*0.6),tlab,'middle');
  dimH(s,ox,ox+RL*k,oy+RS*k+30,(round?'Ø ':'')+'Teppich '+cm(RL),oy+RS*k,oy+RS*k);
  if(!round){dimV(s,oy,oy+RS*k,ox+RL*k+28,cm(RS),ox+RL*k,ox+RL*k,'right');dimH(s,cx-L*k/2,cx+L*k/2,oy-14,'Tisch '+cm(L),cy-B*k/2,cy-B*k/2)}
  var over=round?(dia-L)/2:Math.min((RL-L)/2,(RS-B)/2);
  dimH(s,ox,cx-L*k/2,cy+(round?0:B*k/2+ch+26),cm(round?(dia-L)/2:(RL-L)/2),null,null,'below');
  var name=round?'Ø '+dia+' cm':RS+' × '+RL+' cm';
  if(custom){var html='<span class="big">'+name+' nach Maß</span>Für deinen Tisch gibt es keine gängige Teppichgröße. Damit die Stühle auch zurückgeschoben auf dem Teppich bleiben, braucht er rundum '+cm(e)+', also '+(round?'einen Durchmesser von '+cm(dia):cm(RS)+' × '+cm(RL))+'. Frag nach einem Teppich nach Maß. Die größte gängige Größe ist '+(round?'Ø 300 cm':'300 × 400 cm')+', dann bleibt weniger Rand. '+amz('Teppich nach Maß','Teppiche nach Maß ansehen');return {html:html}}
  var html='<span class="big">'+name+'</span>Um den Tisch bleiben mindestens '+cm(over)+' Teppich. So stehen die Stühle auch zurückgeschoben noch darauf. '+amz(round?'runder Teppich '+dia+' cm':'Teppich '+RS+'x'+RL,(round?'Runde Teppiche Ø '+dia+' cm':'Teppiche '+RS+' × '+RL+' cm')+' ansehen');
  return {html:html}}
function bed(box,o){
  prep(box);
  var Bw=o.bed,Bl=200,needL=Bw+2*R.bedSide,size=pick(R.rugSizes,needL,R.bedFront+60)||R.rugSizes[R.rugSizes.length-1];
  var RL=size[1],RS=size[0],out=R.bedFront,cover=Math.min(Bl,RS-out);
  var W=640,H=430,ml=Math.max(40,FS*3),mr=Math.max(120,FS*6),mt=Math.max(40,FS*2.6),mb=Math.max(70,FS*4),extH=Bl-cover+RS,extW=Math.max(RL,Bw+2*55);
  var k=Math.min((W-ml-mr)/extW,(H-mt-mb)/extH),ox=ml+((W-ml-mr)-extW*k)/2,oy=mt;
  var s=svg(box,W,H),bx=ox+(extW-Bw)/2*k,rx=ox+(extW-RL)/2*k,ry=oy+(Bl-cover)*k;
  E('rect',{x:rx,y:ry,width:RL*k,height:RS*k,rx:3,'class':'d-rug'},s);
  E('rect',{x:bx,y:oy,width:Bw*k,height:Bl*k,rx:5,'class':'d-obj'},s);
  E('rect',{x:bx,y:oy,width:Bw*k,height:9*k,'class':'d-soft'},s);
  var pw=Bw>120?(Bw*k-18)/2:Bw*k-12;E('rect',{x:bx+6,y:oy+14*k,width:pw,height:38*k,rx:6,'class':'d-soft'},s);if(Bw>120)E('rect',{x:bx+12+pw,y:oy+14*k,width:pw,height:38*k,rx:6,'class':'d-soft'},s);
  E('line',{x1:bx,y1:oy+70*k,x2:bx+Bw*k,y2:oy+70*k,'class':'d-line'},s);
  E('rect',{x:bx-50*k,y:oy+4,width:42*k,height:40*k,rx:3,'class':'d-soft'},s);E('rect',{x:bx+Bw*k+8*k,y:oy+4,width:42*k,height:40*k,rx:3,'class':'d-soft'},s);
  dimH(s,rx,rx+RL*k,ry+RS*k+30,'Teppich '+cm(RL),ry+RS*k,ry+RS*k);
  dimV(s,ry,ry+RS*k,rx+RL*k+28,cm(RS),rx+RL*k,rx+RL*k,'right');
  dimH(s,rx,bx,ry+RS*k*0.45,cm((RL-Bw)/2),null,null,'below');
  var html='<span class="big">'+RS+' × '+RL+' cm</span>Quer unter das Bett gelegt, schauen links und rechts je '+cm((RL-Bw)/2)+' und am Fußende '+cm(out)+' Teppich hervor. Die Nachttische bleiben frei. '+amz('Teppich '+RS+'x'+RL,'Teppiche '+RS+' × '+RL+' cm ansehen');
  return {html:html}}

/* ---------- Vorhang ---------- */
function curtain(box,o){
  prep(box);
  var Bw=o.w,Bh=o.h,sill=o.sill,room=o.room,top=sill+Bh;
  if(top>room-R.ceilingGap){oops(box,'Fenster reicht bis '+cm(top)+', Raum '+cm(room));return {html:check('Das Fenster reicht mit '+cm(sill)+' Abstand zum Boden und '+cm(Bh)+' Höhe bis '+cm(top)+'. Der Raum ist aber nur '+cm(room)+' hoch. Prüfe Fensterhöhe, Abstand zum Boden und Raumhöhe.')}}
  var rodH=Math.min(top+R.rodAbove,room-R.ceilingGap),ceiling=room-top<R.rodAbove+R.ceilingGap;
  var full=o.full||R.fullness,rod=Bw+2*R.rodSide,len=rodH-R.floorGap,fabric=rod*full,n=Math.max(2,Math.ceil(fabric/R.panelWidth));if(n%2)n++;
  var W=640,H=460,ml=Math.max(110,FS*8.2),mr=Math.max(110,FS*7.6),mt=Math.max(30,FS*2.2),mb=36,extW=rod+40,extH=room;
  var k=Math.min((W-ml-mr)/extW,(H-mt-mb)/extH),cx=W/2,fy=mt+room*k;
  var s=svg(box,W,H),Y=function(h){return fy-h*k};
  E('line',{x1:20,y1:fy,x2:W-20,y2:fy,'class':'d-floor'},s);E('line',{x1:20,y1:Y(room),x2:W-20,y2:Y(room),'class':'d-line'},s);
  text(s,24,Y(room)+18,'Decke');text(s,24,fy-8,'Boden');
  var wx=cx-Bw*k/2;E('rect',{x:wx,y:Y(top),width:Bw*k,height:Bh*k,'class':'d-obj'},s);
  E('rect',{x:wx+6,y:Y(top)+6,width:Bw*k-12,height:Bh*k-12,'class':'d-soft'},s);E('line',{x1:cx,y1:Y(top)+6,x2:cx,y2:Y(sill)-6,'class':'d-line'},s);
  var cw=Math.min(rod*k*0.24,(R.rodSide+Bw*0.12)*k);
  [cx-rod*k/2,cx+rod*k/2-cw].forEach(function(x){E('rect',{x:x,y:Y(rodH),width:cw,height:len*k,'class':'d-cloth'},s);for(var i=1;i<4;i++)E('line',{x1:x+cw*i/4,y1:Y(rodH)+4,x2:x+cw*i/4,y2:Y(rodH)+len*k-2,'class':'d-hint'},s)});
  E('line',{x1:cx-rod*k/2-6,y1:Y(rodH),x2:cx+rod*k/2+6,y2:Y(rodH),'class':'d-line','stroke-width':4},s);
  dimH(s,cx-rod*k/2,cx+rod*k/2,Y(rodH)-18,'Stange '+cm(rod),Y(rodH),Y(rodH));
  dimH(s,wx,wx+Bw*k,Y(sill)+22,'Fenster '+cm(Bw),Y(sill),Y(sill));
  dimV(s,Y(rodH),fy,cx+rod*k/2+40,'Höhe '+cm(rodH),cx+rod*k/2+6,null);
  dimV(s,Y(rodH),Y(rodH)+len*k,cx-rod*k/2-40,'Vorhang '+cm(len),cx-rod*k/2,null);
  var html='<span class="big">Stange '+cm(rod)+'</span>Montiere sie auf '+cm(rodH)+' Höhe'+(ceiling?', am besten mit Deckenträgern, weil über dem Fenster kaum Platz ist':'')+'. Für bodenlange Vorhänge brauchst du '+cm(Math.ceil(fabric/10)*10)+' Stoffbreite, zum Beispiel '+n+' Schals mit je '+R.panelWidth+' cm, und etwa '+cm(len)+' Länge. Wo genau du die Länge misst, hängt von der Aufhängung ab und steht beim Vorhang. '+amz('Vorhang '+R.panelWidth+'x'+(Math.ceil(len/5)*5)+' cm','Vorhänge ansehen')+' '+amz('Gardinenstange '+(Math.ceil(rod/10)*10)+' cm','Gardinenstangen ansehen');
  return {html:html}}

/* ---------- Bilder ---------- */
function picture(box,o){
  prep(box);
  var h=o.h,w=o.w,above=o.mode==='moebel',F=o.F,a=o.a;
  var gap=o.what==='Sideboard'?R.picGapBoard:R.picGap,center=above?F+gap+h/2:R.picCenter;if(!above&&center-h/2<30)center=h/2+30;
  var nail=center+h/2-a;
  var room=Math.max(250,center+h/2+30);
  var W=640,H=460,ml=Math.max(130,FS*8),mr=Math.max(150,FS*8.6),mt=24,mb=34,extW=Math.max(w,above?220:w)+40;
  var k=Math.min((W-ml-mr)/extW,(H-mt-mb)/room),cx=ml+(W-ml-mr)/2,fy=mt+room*k,Y=function(v){return fy-v*k};
  var s=svg(box,W,H);E('line',{x1:20,y1:fy,x2:W-20,y2:fy,'class':'d-floor'},s);text(s,24,fy-8,'Boden');
  if(above){var sw=o.MW||Math.max(200,w+60);E('path',{d:'M'+(cx-sw*k/2)+' '+fy+'V'+Y(F-25)+'q0 -'+(25*k)+' '+(25*k)+' -'+(25*k)+'H'+(cx+sw*k/2-25*k)+'q'+(25*k)+' 0 '+(25*k)+' '+(25*k)+'V'+fy,'class':'d-obj'},s);text(s,cx,Y(F/2)+5,o.what||'Sofa','middle')}
  E('line',{x1:30,y1:Y(R.picCenter),x2:W-30,y2:Y(R.picCenter),'class':'d-hint'},s);text(s,W-30,Y(R.picCenter)-8,'Augenhöhe '+R.picCenter+' cm','end');
  var fx=cx-w*k/2,ft=Y(center+h/2);E('rect',{x:fx,y:ft,width:w*k,height:h*k,'class':'d-obj'},s);E('rect',{x:fx+8,y:ft+8,width:w*k-16,height:h*k-16,'class':'d-soft'},s);
  E('path',{d:'M'+(cx-7)+' '+Y(nail)+'l7 -7 7 7','class':'d-line'},s);E('circle',{cx:cx,cy:Y(nail)-7,r:3,'class':'d-ink'},s);
  dimV(s,Y(center),fy,fx-34,'Mitte '+cm(center),fx,null,'left');
  dimV(s,Y(nail)-7,fy,fx+w*k+34,'Nagel '+cm(nail),cx+10,null,'right');
  if(above)dimV(s,Y(F),Y(center-h/2),cx,cm(gap),null,null,'right');
  var html='<span class="big">Nagel auf '+cm(nail)+'</span>'+(above?'Die Unterkante des Bildes sitzt '+cm(gap)+' über '+(o.what==='Sideboard'?'dem Sideboard':'der Sofalehne')+', die Bildmitte damit auf '+cm(center)+'.'+(o.MW?' Schön wirkt ein Bild oder eine Gruppe, die zwei Drittel bis drei Viertel so breit ist wie das Möbel: hier '+f(Math.round(o.MW*2/3))+' bis '+cm(o.MW*3/4)+'.':''):'Die Bildmitte liegt auf Augenhöhe, also auf '+cm(center)+'.')+' Gemessen vom Boden, mit dem Aufhänger '+cm(a)+' unter der Oberkante.'+(above&&o.MW?(w>o.MW*0.75?' <b>Achtung:</b> Dein Bild ist breiter als drei Viertel des Möbels und wirkt dort schnell zu wuchtig.':w<o.MW*0.4?' <b>Tipp:</b> Ein einzelnes Bild wirkt über diesem Möbel eher klein. Eine Gruppe aus zwei oder drei Bildern füllt die Fläche besser.':''):'')+' '+amz('Bilderrahmen '+w+'x'+h,'Bilderrahmen ansehen');
  return {html:html}}

/* ---------- Pendelleuchte ---------- */
function pendant(box,o){
  prep(box);
  var T=o.table,room=o.room,lh=o.lamp,above=R.lampAbove(room),bottom=T+above,cord=room-bottom-lh,dMin=Math.round(o.tw/3/5)*5,dMax=Math.round(o.tw/2/5)*5,tl=o.tl;
  var two=tl>=200;
  var W=640,H=460,ml=Math.max(60,FS*4),mr=Math.max(150,FS*7.6),mt=24,mb=34,extW=tl+60;
  var k=Math.min((W-ml-mr)/extW,(H-mt-mb)/room),cx=ml+(W-ml-mr)/2,fy=mt+room*k,Y=function(v){return fy-v*k};
  var s=svg(box,W,H);E('line',{x1:20,y1:fy,x2:W-20,y2:fy,'class':'d-floor'},s);E('line',{x1:20,y1:Y(room),x2:W-20,y2:Y(room),'class':'d-line'},s);text(s,24,Y(room)+18,'Decke');
  var tx=cx-tl*k/2;E('rect',{x:tx,y:Y(T),width:tl*k,height:5*k,'class':'d-obj'},s);E('rect',{x:tx+8*k,y:Y(T)+5*k,width:6*k,height:(T-5)*k,'class':'d-obj'},s);E('rect',{x:tx+tl*k-14*k,y:Y(T)+5*k,width:6*k,height:(T-5)*k,'class':'d-obj'},s);
  var d=dMax;
  (two?[cx-tl*k/4,cx+tl*k/4]:[cx]).forEach(function(x){E('line',{x1:x,y1:Y(room),x2:x,y2:Y(bottom+lh),'class':'d-line'},s);E('path',{d:'M'+(x-d*k/2)+' '+Y(bottom)+'L'+(x-d*k*0.22)+' '+Y(bottom+lh)+'H'+(x+d*k*0.22)+'L'+(x+d*k/2)+' '+Y(bottom)+'Z','class':'d-obj'},s)});
  var lx=two?cx+tl*k/4:cx;
  dimV(s,Y(bottom),Y(T),lx+d*k/2+30,cm(above),lx+d*k/2,tx+tl*k,'right');
  dimV(s,Y(room),Y(bottom+lh),lx+d*k/2+30,'Pendel '+cm(cord),null,lx+6,'right');
  dimV(s,Y(T),fy,tx-26,cm(T),tx,null,'left');
  var html='<span class="big">Pendel '+cm(cord)+'</span>Die Unterkante der Leuchte hängt '+cm(above)+' über der Tischplatte, also auf '+cm(bottom)+' vom Boden. Als Schirmdurchmesser passen '+f(dMin)+' bis '+cm(dMax)+(two?'. Bei so einem langen Tisch kannst du auch zwei Leuchten nebeneinander hängen.':'.')+' '+amz('Pendelleuchte Esstisch','Pendelleuchten ansehen');
  return {html:html}}

/* ---------- Wandfarbe ---------- */
function paint(box,o){
  prep(box);
  var L=o.L,B=o.B,H=o.H,wall=2*(L+B)*H/1e4,doors=o.doors*R.door[0]*R.door[1]/1e4,wins=o.wins*R.window[0]*R.window[1]/1e4,ceil=o.ceil?L*B/1e4:0;
  var yld=o.yld||R.paintYield,area=Math.max(0,wall-doors-wins)+ceil,lit=area*o.coats/yld,b=buckets(lit);
  if(area<0.5){oops(box,'Türen und Fenster größer als die Wände');return {html:check('Türen und Fenster sind zusammen größer als die Wandfläche von '+f(wall,1)+' m². Prüfe Raumlänge, Raumbreite und die Zahl der Fenster und Türen.')}}
  var W=640,H2=460,ml=24,mr=24,mt=Math.max(46,FS*2.8),gap=Math.max(92,FS*5.6),mb=Math.max(56,FS*3.6),row=L+B,k=Math.min((W-ml-mr)/row,(H2-mt-mb-gap)/(2*H)),ox=(W-row*k)/2;
  var s=svg(box,W,H2),plan=[[],[],[],[]],wi=o.wins,di=o.doors,wall=0,walls=[L,B,L,B];
  while(wi>0&&(plan[0].length+plan[1].length+plan[2].length)<6){if(plan[wall].length<2){plan[wall].push('w');wi--}wall=(wall+1)%3}
  while(di>0&&plan[3].length<2){plan[3].push('d');di--}
  walls.forEach(function(wl,i){var r=i>1?1:0,x=ox+(i%2?L*k:0),top=mt+r*(H*k+gap),fy=top+H*k;
    E('rect',{x:x,y:top,width:wl*k,height:H*k,'class':'d-cloth'},s);
    plan[i].forEach(function(t,j){var iw=t==='w'?R.window[0]:R.door[0],ih=t==='w'?R.window[1]:R.door[1],bot=t==='w'?R.sill:0;var px=x+(wl*k)*(j+1)/(plan[i].length+1)-iw*k/2;E('rect',{x:px,y:fy-(bot+ih)*k,width:iw*k,height:ih*k,'class':'d-obj'},s)});
    text(s,x+wl*k/2,top-FS*0.45,'Wand '+(i+1),'middle');
    E('line',{x1:x,y1:fy,x2:x+wl*k,y2:fy,'class':'d-floor'},s);dimH(s,x,x+wl*k,fy+FS*1.8,cm(wl),fy,fy)});
  if(di>0||wi>0)text(s,W/2,H2-FS*0.4,'Weitere Fenster und Türen sind eingerechnet','middle');
  var html='<span class="big">'+f(lit,1)+' Liter</span>Zu streichen sind etwa '+f(area,1)+' m²'+(o.ceil?' mit Decke':'')+'. Bei '+(o.coats===1?'einem Anstrich':o.coats+' Anstrichen')+' und '+f(yld,yld%1?1:0)+' m² je Liter reicht: <b>'+b.txt+'</b>. '+amz('Wandfarbe weiß '+(b.max)+' Liter','Wandfarbe ansehen');
  return {html:html}}
function buckets(l){var best=null;for(var a=0;a<=4;a++)for(var c=0;c<=4;c++)for(var e=0;e<=4;e++){var t=a*10+c*5+e*2.5;if(t+1e-9<l||a+c+e===0)continue;var sc=t*10+(a+c+e);if(!best||sc<best.sc)best={sc:sc,a:a,c:c,e:e,t:t}}
  if(!best)return {txt:Math.ceil(l/10)+' × 10 l',max:10};var p=[];if(best.a)p.push(best.a+' × 10 l');if(best.c)p.push(best.c+' × 5 l');if(best.e)p.push(best.e+' × 2,5 l');return {txt:p.join(' und '),max:best.a?10:best.c?5:2.5}}

/* ---------- Tapete ---------- */
function wallpaper(box,o){
  prep(box);
  var Wd=o.wall,H=o.H,rp=o.rapport,rw=o.roll,rl=R.rollLen[rw]||1005,bahn=rp>0?Math.ceil((H+R.rollAdd)/rp)*rp:H+R.rollAdd,strips=Math.ceil(Wd/rw),per=Math.floor(rl/bahn),rolls=per>0?Math.ceil(strips/per):strips;
  var W=640,H2=380,ml=30,mr=Math.max(110,FS*5.6),mt=Math.max(44,FS*3.8),mb=Math.max(60,FS*3.6),k=Math.min((W-ml-mr)/Wd,(H2-mt-mb)/H),ox=ml+((W-ml-mr)-Wd*k)/2,fy=mt+H*k;
  var s=svg(box,W,H2);
  for(var i=0;i<strips;i++){var x=ox+i*rw*k,w=Math.min(rw,Wd-i*rw)*k;E('rect',{x:x,y:mt,width:w,height:H*k,'class':i%2?'d-soft':'d-cloth'},s)}
  E('line',{x1:ox-10,y1:fy,x2:ox+Wd*k+10,y2:fy,'class':'d-floor'},s);
  dimH(s,ox,ox+Wd*k,fy+30,'Wand '+cm(Wd),fy,fy);
  dimV(s,mt,fy,ox+Wd*k+30,cm(H),ox+Wd*k,ox+Wd*k,'right');
  if(strips>1)dimH(s,ox,ox+rw*k,mt-14,cm(rw),null,null,'above');
  if(per<1){oops(box,'Bahn länger als die Rolle');return {html:check('Eine Bahn wäre '+cm(bahn)+' lang, die Rolle hat aber nur '+f(rl/100,2)+' m. Prüfe Raumhöhe und Rapport.')}}
  var html='<span class="big">'+rolls+' '+(rolls===1?'Rolle':'Rollen')+' + 1 Reserve</span>'+strips+' '+(strips===1?'Bahn':'Bahnen')+' à '+cm(rw)+', '+(strips===1?'sie ist ':'jede ')+cm(bahn)+' lang'+(rp?' (mit '+cm(rp)+' Rapport)':'')+'. Aus einer Rolle mit '+f(rl/100,2)+' m schneidest du '+per+' '+(per===1?'Bahn':'Bahnen')+'. Kauf eine Rolle Reserve dazu, alle mit derselben Chargennummer. '+amz('Vliestapete '+(rw>60?'1,06 m':'0,53 m'),'Tapeten ansehen');
  return {html:html}}

window.SD={R:R,rug:{living:living,dining:dining,bed:bed},curtain:curtain,picture:picture,pendant:pendant,paint:paint,wallpaper:wallpaper,f:f,cm:cm};
})();
