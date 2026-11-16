"""Regenerate the printable maps with Python, ReportLab and Node.js."""

import json
from pathlib import Path
import subprocess

import reportlab
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.svgpath import SvgPath
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


SITE = Path(__file__).resolve().parent
DEST = SITE / "dist" / "pdf"
INK = HexColor("#202626")
WIRE = HexColor("#42637f")
MARKS = {
    "recommended": ("R", "Recomendação da curadoria", HexColor("#6731a1")),
    "alternative": ("A", "Opção alternativa", HexColor("#356644")),
    "anytime": ("L", "Ordem livre", HexColor("#52575a")),
}

# Reuse the browser's layout and editorial choices, including its Bézier curves.
LAYOUT = """
import fs from 'node:fs';
import {mapLayout} from './dist/map-layout.js';
import {meta} from './dist/catalog.js';
import {guidance} from './dist/guidance.js';
const maps = Object.entries(meta).map(([id, {name}]) => {
  const map = JSON.parse(fs.readFileSync('./dist/data/' + id + '.json'));
  const {width, height, edges, nodes} = mapLayout(map, false);
  return {id, name, width, height, edges, nodes: map.nodes.map(({id: key, title, lane}) =>
    ({title, lane, role: guidance[id]?.[key]?.role, ...nodes.get(key)}))};
});
process.stdout.write(JSON.stringify(maps));
"""


def draw_badge(pdf, x, y, role):
    letter, _, color = MARKS[role]
    pdf.setFillColor(color)
    pdf.circle(x, y, 7, stroke=0, fill=1)
    pdf.setFillColor(white)
    pdf.setFont("VeraBd", 9)
    pdf.drawCentredString(x, y - 3, letter)


def draw_label(pdf, node, y):
    font = "VeraBd" if node["lane"] == "center" else "Vera"
    available = node["w"] - (18 if node.get("role") else 12)
    for size in range(15, 10, -1):
        lines = simpleSplit(node["title"], font, size, available)
        leading = 1.16 * size
        if len(lines) * leading <= node["h"] - 5 and all(
            pdfmetrics.stringWidth(line, font, size) <= available for line in lines
        ):
            break
    else:
        raise ValueError(f"Título fora do retângulo: {node['title']}")
    pdf.setFillColor(INK)
    pdf.setFont(font, size)
    baseline = y + (len(lines) - 1) * leading / 2 - size * 0.33
    for line in lines:
        pdf.drawCentredString(node["x"], baseline, line)
        baseline -= leading


def make_poster(item):
    width, height = item["width"], item["height"]
    margin, header = 28, 102
    # Real-size plots are 42 cm wide; the two short maps fit on A4 landscape.
    paper_width = (297 if height < width else 420) * mm
    scale = paper_width / (width + 2 * margin)
    paper_height = max(210 * mm if height < width else 0, (height + header + 2 * margin) * scale)
    pdf = Canvas(str(DEST / f"{item['id']}.pdf"), pagesize=(paper_width, paper_height),
                 pageCompression=1, invariant=1, lang="pt-BR")
    pdf.setTitle(item["name"])
    pdf.setAuthor("Trilhas da Psicologia")
    pdf.scale(scale, scale)
    pdf.translate(margin, paper_height / scale - margin - header - height)
    pdf.setFillColor(INK)
    pdf.setFont("Vera", 13)
    pdf.drawString(0, height + 85, "Trilhas da Psicologia")
    pdf.setFont("VeraBd", 30)
    pdf.drawString(0, height + 46, item["name"])
    legend_x = 7
    for role, (_, label, _) in MARKS.items():
        draw_badge(pdf, legend_x, height + 16, role)
        pdf.setFillColor(INK)
        pdf.setFont("Vera", 12)
        pdf.drawString(legend_x + 12, height + 12, label)
        legend_x += 40 + pdfmetrics.stringWidth(label, "Vera", 12)

    wires = Drawing(width, height)
    wires.translate(0, height)
    wires.scale(1, -1)
    for edge in item["edges"]:
        wires.add(SvgPath(edge["d"], fillColor=None, strokeColor=WIRE, strokeWidth=2.2,
                          strokeLineCap=1, strokeDashArray=[0.8, 5] if edge["kind"] == "branch" else None))
    renderPDF.draw(wires, pdf, 0, 0)
    for node in item["nodes"]:
        x, y, w, h = node["x"], height - node["y"], node["w"], node["h"]
        pdf.setStrokeColor(INK)
        pdf.setLineWidth(1.7)
        pdf.setFillColor(HexColor("#ffdc60" if node["lane"] == "center" else "#fff0c2"))
        pdf.roundRect(x - w / 2, y - h / 2, w, h, 4, fill=1, stroke=1)
        draw_label(pdf, node, y)
        if node.get("role"):
            draw_badge(pdf, x + (w / 2 if x >= width / 2 else -w / 2), y, node["role"])
    pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    font_dir = Path(reportlab.__file__).resolve().parent / "fonts"
    for name in ("Vera", "VeraBd"):
        pdfmetrics.registerFont(TTFont(name, str(font_dir / f"{name}.ttf")))
    maps = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", LAYOUT], cwd=SITE))
    DEST.mkdir(exist_ok=True)
    for item in maps:
        make_poster(item)
