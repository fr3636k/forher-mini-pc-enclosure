from pathlib import Path
from io import BytesIO
import shutil,math
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3,landscape
from pypdf import PdfReader,PdfWriter
import pypdfium2 as pdfium

ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
STAGE=ROOT/'tmp'/'pdfs';STAGE.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'output'/'pdf';OUT.mkdir(parents=True,exist_ok=True)
fontpath=Path(r'C:\Windows\Fonts\msjh.ttc')
try:pdfmetrics.registerFont(TTFont('CJK',str(fontpath),subfontIndex=0))
except Exception:pdfmetrics.registerFont(UnicodeCIDFont('MSung-Light'));fontpath=None
FONT='CJK' if fontpath else 'MSung-Light'
PURPLE='#7a2cb0';MUTED='#675b70';LINE='#dfd4e7';WOOD='#d9b789';STEEL='#a7afb5';RUBBER='#30353e'

# Diagrams share 1 SVG unit = 1 mm with the six existing board cards.
cards={
'G':('雙 J 鉤 · 2 件',f'''<path d="M100 192 V43 H153 V76 H149 V48 H104 V192 Z" fill="{STEEL}" stroke="#63707a"/><rect x="205" y="43" width="28" height="149" fill="{STEEL}" stroke="#63707a"/><path d="M91 43 V192 M100 205 H153" stroke="{PURPLE}"/><text x="81" y="120" transform="rotate(-90 81 120)" text-anchor="middle">149 高（估）</text><text x="126" y="220" text-anchor="middle">53 伸出（估）</text><text x="219" y="210" text-anchor="middle">28 寬</text><text x="126" y="250" text-anchor="middle">鋼片 4／頂橋 5・內開口 43（估）</text>''','上方承掛，尺寸與開口依把手確認。'),
'H':('前伸支撐臂 · 1 件',f'''<rect x="30" y="95" width="240" height="30" fill="{WOOD}" stroke="#795f41"/><path d="M30 140 H270 M18 95 V125" stroke="{PURPLE}"/><text x="150" y="158" text-anchor="middle">240 總長（估）／向機器前方 →</text><text x="10" y="110" transform="rotate(-90 10 110)" text-anchor="middle">30 高</text><rect x="132" y="180" width="32" height="30" fill="{WOOD}" stroke="#795f41"/><text x="148" y="228" text-anchor="middle">32 側向厚度（估）</text><text x="150" y="255" text-anchor="middle">超出盒前緣約150 mm，待實測</text>''','向前跨過懸空區，前端才接觸機身。'),
'I':('接觸軟墊 · 2 件',f'''<rect x="105" y="105" width="18" height="30" fill="{RUBBER}"/><rect x="145" y="105" width="18" height="30" fill="{RUBBER}"/><rect x="220" y="105" width="4" height="30" fill="{RUBBER}"/><text x="114" y="158" text-anchor="middle">18 寬</text><text x="222" y="158" text-anchor="middle">4 厚</text><text x="91" y="120" transform="rotate(-90 91 120)" text-anchor="middle">30 高</text><text x="150" y="215" text-anchor="middle">4 × 30 × 18 mm／件（估）</text><text x="150" y="242" text-anchor="middle">移到前伸臂前端，靠住實際機身</text>''','前端兩點靠機身，保護表面並止擺。')}
svgs={}
for key,(title,body,note) in cards.items():
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 280" role="img" aria-label="{key} {title}"><g font-family="sans-serif" font-size="10.5" fill="{MUTED}"><text x="25" y="22" font-size="12" fill="{PURPLE}">{key} / {title}</text>{body}</g></svg>'
 svgs[key]=svg;(DIST/f'part-{key.lower()}.svg').write_text(svg,encoding='utf8')
import re
h=(DIST/'index.html').read_text(encoding='utf8')
for k in cards:
 markup=f'<button class="board-card" data-board="{k}" aria-pressed="false">{svgs[k]}<span class="board-purpose">{cards[k][2]}</span></button>'
 h,count=re.subn(rf'<button class="board-card" data-board="{k}".*?</button\s*>',lambda m:markup,h,flags=re.S)
 if count!=1:raise ValueError(f'Hardware card {k}: {count}')
(DIST/'index.html').write_text(h,encoding='utf8')

# Current A-F board drawings. Web diagrams use one SVG unit per mm.
boardSpecs=[('A','左掀上蓋',220,220,[],'左側鉸鏈，向外掀95°；右側磁吸。'),('B','底板',220,220,[],'承托設備，底部鋪防滑墊。'),('C','左側板',220,82,[(70,41,22.5),(150,41,22.5)],'雙孔通風；鉸鏈裝在通風孔上方。'),('D','右側板',220,82,[(40,41,22.5)],'備用穿線孔，依現場方向使用。'),('E','後板',202,82,[],'U口向上開放，接好線也能放入。'),('F','固定前板',202,82,[(119,33,15)],'Ø30孔操作電源，孔位依主機確認。')]
def boardSVG(k,title,w,h,holes,note):
 x=(300-w)/2;y=35 if h>100 else 90
 if k=='E':
  cx=x+56;cy=y+41;r=22.5
  body=f'<path d="M{x} {y+h} H{x+w} V{y} H{cx+r} V{cy} A{r} {r} 0 0 1 {cx-r} {cy} V{y} H{x} Z" fill="{WOOD}" stroke="#795f41"/>'
 else:body=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{WOOD}" stroke="#795f41"/>'
 for cx,cy,r in holes:body+=f'<circle cx="{x+cx}" cy="{y+h-cy}" r="{r}" fill="#fcf9ff" stroke="{PURPLE}"/>'
 if k=='A':
  for z in [40,180]:body+=f'<rect x="{x-3}" y="{y+z-12}" width="10" height="24" fill="{STEEL}"/>'
 if k=='E':body+=f'<text x="150" y="205" text-anchor="middle">U口寬45／深63.5／R22.5</text>'
 if k=='F':body+=f'<text x="150" y="205" text-anchor="middle">Ø30／孔心距左119、下33</text>'
 body+=f'<text x="150" y="{y+h+17}" text-anchor="middle">{w} mm</text>'
 body+=f'<text x="{x-10}" y="{y+h/2}" text-anchor="middle" transform="rotate(-90 {x-10} {y+h/2})">{h} mm</text>'
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 280" role="img" aria-label="{k} {title} {w}乘{h}毫米"><g font-family="sans-serif" font-size="10" fill="{MUTED}"><text x="25" y="20" font-size="12" fill="{PURPLE}">{k} / {title}　{w} × {h} × 9 mm</text>{body}</g></svg>'
import re
html=(DIST/'index.html').read_text(encoding='utf8')
allSVG=[]
for spec in boardSpecs:
 k,title,w,h,holes,note=spec;svg=boardSVG(*spec);allSVG.append(svg)
 (DIST/f'part-{k.lower()}.svg').write_text(svg,encoding='utf8')
 pattern=rf'<button class="board-card" data-board="{k}".*?</button\s*>'
 html,n=re.subn(pattern,lambda m:f'<button class="board-card" data-board="{k}" aria-pressed="false">{svg}<span class="board-purpose">{note}</span></button>',html,flags=re.S)
 if n!=1:raise ValueError(f'Board card {k}: {n}')
(DIST/'index.html').write_text(html,encoding='utf8')
sheet='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560">'+''.join(f'<svg x="{(i%3)*300}" y="{(i//3)*280}" width="300" height="280" viewBox="0 0 300 280">'+a[a.index('>')+1:a.rfind('</svg>')]+'</svg>' for i,a in enumerate(allSVG))+'</svg>'
(DIST/'boards.svg').write_text(sheet,encoding='utf8')

buf=BytesIO();W,H=landscape(A3);c=canvas.Canvas(buf,pagesize=(W,H));c.setTitle('豐禾小型主機木盒：固定件參考尺寸 V11')
def txt(x,y,s,size=11,color=MUTED):c.setFillColor(HexColor(color));c.setFont(FONT,size);c.drawString(x,y,s)
def wrap(x,y,s,width,size=10,leading=17):
 line=''
 for ch in s:
  if pdfmetrics.stringWidth(line+ch,FONT,size)>width:txt(x,y,line,size);y-=leading;line=ch
  else:line+=ch
 if line:txt(x,y,line,size)
 return y-leading
def rect(x,y,w,h,fill,stroke=LINE,r=0):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke));c.setLineWidth(.8)
 if r:c.roundRect(x,y,w,h,r,stroke=1,fill=1)
 else:c.rect(x,y,w,h,stroke=1,fill=1)
def line(x1,y1,x2,y2,color=PURPLE):c.setStrokeColor(HexColor(color));c.setLineWidth(.8);c.line(x1,y1,x2,y2)
def dim(x1,y1,x2,y2,label,vertical=False):
 line(x1,y1,x2,y2)
 if vertical:
  line(x1-3,y1,x1+3,y1);line(x2-3,y2,x2+3,y2);c.saveState();c.translate(x1-9,(y1+y2)/2);c.rotate(90);c.setFont(FONT,10);c.setFillColor(HexColor(PURPLE));c.drawCentredString(0,0,label);c.restoreState()
 else:
  line(x1,y1-3,x1,y1+3);line(x2,y2-3,x2,y2+3);c.setFont(FONT,10);c.setFillColor(HexColor(PURPLE));c.drawCentredString((x1+x2)/2,y1-15,label)
txt(36,H-45,'豐禾｜小型主機木盒：掛鉤與下方支撐',22,PURPLE)
txt(36,H-68,'V11 參考估算 / 單位 mm / 各組視圖縮放不同，尺寸以數字為準，非 1:1 加工樣板',11)
cardY=329;cardH=H-425;cardW=(W-108)/3
for i,key in enumerate(['G','H','I']):
 x=36+i*(cardW+18);rect(x,cardY,cardW,cardH,'#fcf9ff',LINE,10);txt(x+18,H-121,f'{key} / {cards[key][0]}',14,PURPLE)
# J side and front views, enlarged equally within this card.
x0=102;y0=438;s=1.6
poly=[(0,0),(0,149),(53,149),(53,116),(49,116),(49,144),(4,144),(4,0)]
path=c.beginPath();path.moveTo(x0,y0)
for x,y in poly[1:]:path.lineTo(x0+x*s,y0+y*s)
path.close();c.setFillColor(HexColor(STEEL));c.setStrokeColor(HexColor('#63707a'));c.drawPath(path,fill=1,stroke=1)
rect(263,y0,28*s,149*s,STEEL,'#63707a');dim(86,y0,86,y0+149*s,'149 高（估）',True);dim(x0,421,x0+53*s,421,'53 伸出（估）');dim(263,421,263+28*s,421,'28 寬')
txt(104,699,'側視圖',10);txt(265,699,'正視圖',10)
wrap(54,378,'內開口約 43；鋼片 4、頂橋 5。配 Ø24 把手僅為示意，實際開口與五金規格優先。',cardW-36,10,16)
# Forward arm: the long axis points toward the operator/front of the machine.
hx=36+cardW+18;sc=1.1
rect(hx+40,580,240*sc,30*sc,WOOD,'#795f41')
dim(hx+40,563,hx+40+240*sc,563,'240 總長（估）');dim(hx+26,580,hx+26,613,'30 高',True)
txt(hx+40,639,'側視：向機器前方延伸 →',11)
rect(hx+85,480,32*1.5,30*1.5,WOOD,'#795f41');dim(hx+85,465,hx+133,465,'32 側向厚度（估）')
txt(hx+160,500,'端面：厚 × 高',11)
wrap(hx+18,430,'總長240、突出盒前緣約150，均為模型估算。先跨過懸空區，再讓前端軟墊靠機身。',cardW-36,11,19)
wrap(hx+18,365,'前伸長度與側向厚度分別量測；不是把短墊塊加厚。固定段、螺栓與抗旋轉補強依實物確認。',cardW-36,10,16)
# Rubber pads, same enlargement for width, height and thickness.
ix=36+2*(cardW+18);sp=2.7
for x in [ix+70,ix+145]:rect(x,538,18*sp,30*sp,RUBBER,RUBBER)
rect(ix+266,538,4*sp,30*sp,RUBBER,RUBBER);dim(ix+52,538,ix+52,538+30*sp,'30 高',True);dim(ix+70,521,ix+70+18*sp,521,'18 寬');dim(ix+266,521,ix+266+4*sp,521,'4 厚')
wrap(ix+18,458,'每件暫估 4 厚 × 30 高 × 18 寬，共 2 件。尺寸隨機身接觸面調整。',cardW-36,11,19)
wrap(ix+18,379,'軟墊接觸確認可承壓的機身部位，避開風口、接頭及薄蓋板；避免硬木直接頂壓。',cardW-36,10,16)
# Parts list and installation plan.
txt(36,294,'參考數量與定案方式',14,PURPLE)
rows=[('G','雙 J 鉤','2 件','高149 × 伸出53 × 寬28；開口與板厚依五金確認'),('H','前伸支撐臂','1 件','總長240 × 厚32 × 高30（估）；突出盒前緣約150'),('I','接觸軟墊','2 件','每件厚4 × 高30 × 寬18（估）')]
for i,(k,name,q,detail) in enumerate(rows):
 y=250-i*47;rect(36,y-10,688,42,'#f7f1fb' if i%2==0 else '#ffffff');txt(48,y+7,k,12,PURPLE);txt(76,y+7,name,11);txt(185,y+7,q,11);txt(242,y+7,detail,10)
wrap(36,100,'掛鉤固定可先以 M4 × 30 穿板螺栓 4 組、44 × 32 × 2 內側背板 2 件討論；孔位和螺栓長度須按實物五金確認。金屬鉤交由成品五金或金工配合，木工負責板件、木條與開孔。',688,10,17)
tx=790;txt(tx,294,'俯視：木盒後掛左側，支撐向前',13,PURPLE)
rect(tx+150,80,170,100,'#e5e7e2','#8a928b',10);txt(tx+202,120,'機身',13)
line(tx+150,180,tx+150,273,'#727f78');line(tx+150,273,tx+320,273,'#727f78');line(tx+320,273,tx+320,180,'#727f78')
rect(tx+45,198,85,85,WOOD,'#795f41');txt(tx+62,235,'木盒',11)
for y in [233,262]:rect(tx+128,y,24,8,STEEL,'#63707a')
rect(tx+130,115,16,110,WOOD,'#795f41');rect(tx+146,125,4,16,RUBBER,RUBBER);rect(tx+146,151,4,16,RUBBER,RUBBER);txt(tx+180,210,'此處懸空',11);txt(tx+20,97,'木條向前 ↓',10,PURPLE)
txt(tx+173,65,'前方 / 操作面板 ↓（非尺寸比例）',9);txt(tx+174,311,'後方 ↑',10)
line(36,48,W-36,48,LINE);txt(36,30,'僅供討論與估價：所有固定件尺寸為估算，非承重驗證或最終加工定稿。箱體板件見第 1 頁。',9);txt(W-80,30,'2 / 2',9)
c.showPage();c.save();buf.seek(0)
# Rebuild page 1 from current dimensions rather than overlaying an older drawing.
first=BytesIO();p=canvas.Canvas(first,pagesize=(W,H))
def pt(x,y,t,size=10,color=MUTED):p.setFillColor(HexColor(color));p.setFont(FONT,size);p.drawString(x,y,t)
pt(36,H-43,'豐禾｜小型主機木盒：上掀蓋與箱體板件 V11',21,PURPLE)
pt(36,H-66,'外尺寸220 × 220 × 100 mm／板厚9／各1片／同一比例示意，非1:1加工圖',11)
for i,(k,title,w,h,holes,note) in enumerate(boardSpecs):
 cellX=36+(i%3)*380;top=H-106-(i//3)*300;x=cellX+50;y=top-24-h
 pt(cellX,top,f'{k} / {title}　{w} × {h} × 9 mm',13,PURPLE)
 p.setFillColor(HexColor(WOOD));p.setStrokeColor(HexColor('#795f41'));p.setLineWidth(.8)
 if k=='E':
  cx=x+56;cy=y+41;r=22.5;d=.55228475*r;path=p.beginPath()
  path.moveTo(x,y);path.lineTo(x+w,y);path.lineTo(x+w,y+h);path.lineTo(cx+r,y+h);path.lineTo(cx+r,cy)
  path.curveTo(cx+r,cy-d,cx+d,cy-r,cx,cy-r);path.curveTo(cx-d,cy-r,cx-r,cy-d,cx-r,cy)
  path.lineTo(cx-r,y+h);path.lineTo(x,y+h);path.close();p.drawPath(path,stroke=1,fill=1)
 else:p.rect(x,y,w,h,fill=1,stroke=1)
 for cx,cy,r in holes:
  p.setFillColor(HexColor('#ffffff'));p.setStrokeColor(HexColor(PURPLE));p.circle(x+cx,y+cy,r,fill=1,stroke=1)
 if k=='A':
  for z in [40,180]:p.setFillColor(HexColor(STEEL));p.rect(x-3,y+z-12,10,24,fill=1,stroke=1)
 pt(x+w/2-20,y-17,f'{w} mm');p.saveState();p.translate(x-12,y+h/2);p.rotate(90);pt(-16,0,f'{h} mm');p.restoreState()
 pt(cellX,top-(180 if k=='C' else 278),note,10)
 if k=='C':pt(cellX,top-198,'Ø45 ×2：孔心距後70、150；距下41。',9)
 if k=='D':pt(cellX,top-296,'Ø45：孔心距後40；距下41。',9)
 if k=='E':
  pt(cellX,top-130,'寬45／深63.5／底R22.5',10,PURPLE)
  pt(cellX,top-148,'從盒外看：中心距左56、距下41。',9)
  pt(cellX,top-296,'先鑽Ø45，再向上直切；磨邊加軟護邊。',9)
 if k=='F':
  pt(cellX,top-130,'Ø30／孔心距外側左119、下33',10,PURPLE)
  pt(cellX,top-148,'只供電源鍵操作，維修由上蓋進行。',9)
  pt(cellX,top-296,'電源鍵位置依實際主機重新定位。',9)
pt(36,103,'上蓋左側兩顆表面鉸鏈，向外掀95°；右側磁吸。前板固定。鉸鏈孔與止擋依五金確認。',10)
pt(36,84,'後板U口向上開放，線束從上方放入；閉蓋前整理線材與護邊，不可夾線。',10)
pt(36,65,'鉸鏈側須留約22cm外側與上方淨空，實際依現場驗證。板件外觀視圖；固定件見第2頁。',10)
pt(W-80,30,'1 / 2',9);p.showPage();p.save();first.seek(0)
writer=PdfWriter();writer.add_page(PdfReader(first).pages[0]);writer.add_page(PdfReader(buf).pages[0]);writer.add_metadata({'/Title':'豐禾小型主機木盒：上掀蓋與固定件 V11','/Author':'ForHer','/Subject':'參考估算，需實機確認'})
target=OUT/'豐禾超音波錄影盒-板件與固定件設計圖.pdf'
with target.open('wb') as f:writer.write(f)
shutil.copyfile(target,DIST/'豐禾超音波錄影盒-板件設計圖.pdf')
doc=pdfium.PdfDocument(str(target))
for i,page in enumerate(doc):page.render(scale=1.15).to_pil().save(STAGE/f'design-{i+1}.png')
print('PDF pages:',len(doc));print('PDF output:',target);print('Hardware SVG cards generated: G,H,I')
