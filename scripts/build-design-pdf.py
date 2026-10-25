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
'H':('支撐木條 · 1 件',f'''<rect x="90" y="105" width="60" height="30" fill="{WOOD}" stroke="#795f41"/><rect x="205" y="105" width="32" height="30" fill="{WOOD}" stroke="#795f41"/><path d="M90 148 H150 M78 105 V135 M205 148 H237" stroke="{PURPLE}"/><text x="120" y="166" text-anchor="middle">60 跨距（估）</text><text x="68" y="120" transform="rotate(-90 68 120)" text-anchor="middle">30 高</text><text x="221" y="166" text-anchor="middle">32 伸出</text><text x="150" y="215" text-anchor="middle">伸出量 = 現場間距 − 軟墊厚度</text><text x="150" y="242" text-anchor="middle">寬、高與伸出量均待確認</text>''','下方止擺，長度依現場間距裁切。'),
'I':('接觸軟墊 · 2 件',f'''<rect x="105" y="105" width="18" height="30" fill="{RUBBER}"/><rect x="145" y="105" width="18" height="30" fill="{RUBBER}"/><rect x="220" y="105" width="4" height="30" fill="{RUBBER}"/><text x="114" y="158" text-anchor="middle">18 寬</text><text x="222" y="158" text-anchor="middle">4 厚</text><text x="91" y="120" transform="rotate(-90 91 120)" text-anchor="middle">30 高</text><text x="150" y="215" text-anchor="middle">4 × 30 × 18 mm／件（估）</text><text x="150" y="242" text-anchor="middle">末端接觸機身，避免硬木直接頂壓</text>''','兩點接觸，減少晃動並保護機身。')}
svgs={}
for key,(title,body,note) in cards.items():
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 280" role="img" aria-label="{key} {title}"><g font-family="sans-serif" font-size="10.5" fill="{MUTED}"><text x="25" y="22" font-size="12" fill="{PURPLE}">{key} / {title}</text>{body}</g></svg>'
 svgs[key]=svg;(DIST/f'part-{key.lower()}.svg').write_text(svg,encoding='utf8')
h=(DIST/'index.html').read_text(encoding='utf8')
if 'data-board="G"' not in h:
 point=h.rfind('        </div>',0,h.index('        <p class="board-hint"'))
 markup=''.join(f'<button class="board-card" data-board="{k}" aria-pressed="false">{svgs[k]}<span class="board-purpose">{cards[k][2]}</span></button>' for k in cards)
 h=h[:point]+markup+'\n'+h[point:];(DIST/'index.html').write_text(h,encoding='utf8')

buf=BytesIO();W,H=landscape(A3);c=canvas.Canvas(buf,pagesize=(W,H));c.setTitle('豐禾小型主機木盒：固定件參考尺寸 V9')
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
txt(36,H-68,'V9 參考估算 / 單位 mm / 各組視圖縮放不同，尺寸以數字為準，非 1:1 加工樣板',11)
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
# Support front section and side projection.
hx=36+cardW+18;sc=2.45
rect(hx+49,538,60*sc,30*sc,WOOD,'#795f41');rect(hx+232,538,32*sc,30*sc,WOOD,'#795f41')
dim(hx+49,521,hx+49+60*sc,521,'60 跨距（估）');dim(hx+35,538,hx+35,538+30*sc,'30 高（估）',True);dim(hx+232,521,hx+232+32*sc,521,'32 伸出（估）')
txt(hx+57,639,'沿盒壁的寬 × 高',11);txt(hx+232,639,'往機身伸出',11)
wrap(hx+18,458,'跨距 60 × 高 30 是討論用估算，尚未定案。伸出 32 只對應目前模型間距。',cardW-36,11,19)
wrap(hx+18,379,'伸出量 = 空盒掛好後量到的間距 - 軟墊厚度 4。現場確認後裁切，固定孔依材質與五金定位。',cardW-36,10,16)
# Rubber pads, same enlargement for width, height and thickness.
ix=36+2*(cardW+18);sp=2.7
for x in [ix+70,ix+145]:rect(x,538,18*sp,30*sp,RUBBER,RUBBER)
rect(ix+266,538,4*sp,30*sp,RUBBER,RUBBER);dim(ix+52,538,ix+52,538+30*sp,'30 高',True);dim(ix+70,521,ix+70+18*sp,521,'18 寬');dim(ix+266,521,ix+266+4*sp,521,'4 厚')
wrap(ix+18,458,'每件暫估 4 厚 × 30 高 × 18 寬，共 2 件。尺寸隨機身接觸面調整。',cardW-36,11,19)
wrap(ix+18,379,'軟墊接觸確認可承壓的機身部位，避開風口、接頭及薄蓋板；避免硬木直接頂壓。',cardW-36,10,16)
# Parts list and installation plan.
txt(36,294,'參考數量與定案方式',14,PURPLE)
rows=[('G','雙 J 鉤','2 件','高149 × 伸出53 × 寬28；開口與板厚依五金確認'),('H','支撐木條','1 件','跨60 × 高30 × 伸出32（估）；伸出量須現場量測'),('I','接觸軟墊','2 件','每件厚4 × 高30 × 寬18（估）')]
for i,(k,name,q,detail) in enumerate(rows):
 y=250-i*47;rect(36,y-10,688,42,'#f7f1fb' if i%2==0 else '#ffffff');txt(48,y+7,k,12,PURPLE);txt(76,y+7,name,11);txt(185,y+7,q,11);txt(242,y+7,detail,10)
wrap(36,100,'掛鉤固定可先以 M4 × 30 穿板螺栓 4 組、44 × 32 × 2 內側背板 2 件討論；孔位和螺栓長度須按實物五金確認。金屬鉤交由成品五金或金工配合，木工負責板件、木條與開孔。',688,10,17)
tx=790;txt(tx,294,'安裝俯視示意：木盒在後把手左側',13,PURPLE)
rect(tx+150,86,170,155,'#e5e7e2','#8a928b',10);txt(tx+202,155,'機身',13)
line(tx+150,225,tx+150,273,'#727f78');line(tx+150,273,tx+320,273,'#727f78');line(tx+320,273,tx+320,225,'#727f78')
rect(tx+45,198,85,85,WOOD,'#795f41');txt(tx+62,235,'木盒',11)
for y in [233,262]:rect(tx+128,y,24,8,STEEL,'#63707a')
rect(tx+130,205,16,15,WOOD,'#795f41');rect(tx+146,205,4,15,RUBBER,RUBBER)
txt(tx+173,65,'前方 / 操作面板 ↓',10);txt(tx+174,311,'後方 ↑',10)
line(36,48,W-36,48,LINE);txt(36,30,'僅供討論與估價：所有固定件尺寸為估算，非承重驗證或最終加工定稿。箱體板件見第 1 頁。',9);txt(W-80,30,'2 / 2',9)
c.showPage();c.save();buf.seek(0)
base=PdfReader(str(DIST/'豐禾超音波錄影盒-板件設計圖.pdf'))
overlay=BytesIO();oc=canvas.Canvas(overlay,pagesize=(W,H));oc.setFillColor(HexColor('#ffffff'));oc.rect(110,H-75,950,50,fill=1,stroke=0);oc.setFillColor(HexColor(PURPLE));oc.setFont(FONT,20);oc.drawString(134,H-57,'豐禾｜小型主機木盒 — 箱體板件 V9');oc.setFont(FONT,9);oc.drawString(W-80,30,'1 / 2');oc.save();overlay.seek(0);base.pages[0].merge_page(PdfReader(overlay).pages[0])
writer=PdfWriter();writer.add_page(base.pages[0]);writer.add_page(PdfReader(buf).pages[0]);writer.add_metadata({'/Title':'豐禾小型主機木盒：箱體與固定件 V9','/Author':'ForHer','/Subject':'參考估算，需實機確認'})
target=OUT/'豐禾超音波錄影盒-板件與固定件設計圖.pdf'
with target.open('wb') as f:writer.write(f)
shutil.copyfile(target,DIST/'豐禾超音波錄影盒-板件設計圖.pdf')
doc=pdfium.PdfDocument(str(target))
for i,page in enumerate(doc):page.render(scale=1.15).to_pil().save(STAGE/f'design-{i+1}.png')
print('PDF pages:',len(doc));print('PDF output:',target);print('Hardware SVG cards generated: G,H,I')
