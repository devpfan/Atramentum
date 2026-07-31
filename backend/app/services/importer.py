import os
import subprocess
import tempfile
import uuid
from typing import List, Dict
import docx
import re

def convert_to_docx(input_path: str, output_dir: str) -> str:
    """
    Convierte un archivo (.doc, .odt) a .docx usando LibreOffice (soffice).
    Retorna la ruta del nuevo archivo .docx.
    """
    try:
        subprocess.run([
            "soffice", "--headless", "--convert-to", "docx",
            input_path, "--outdir", output_dir
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        return os.path.join(output_dir, f"{base_name}.docx")
    except Exception as e:
        raise Exception(f"Error convirtiendo documento a docx: {str(e)}")

def parse_docx(file_path: str) -> List[Dict[str, str]]:
    doc = docx.Document(file_path)
    chapters = []
    current_chapter_title = "Capítulo 1"
    current_chapter_html = []
    
    chapter_regex = re.compile(r'^(capítulo|capitulo|chapter)', re.IGNORECASE)
    
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
            
        is_chapter_heading = False
        # Heurística 1: Estilo Heading 1 o Heading 2
        if p.style and p.style.name and p.style.name.startswith('Heading'):
            if p.style.name in ['Heading 1', 'Heading 2']:
                is_chapter_heading = True
        
        # Heurística 2: Texto empieza por "Capítulo"
        if chapter_regex.match(text):
            is_chapter_heading = True
            
        if is_chapter_heading:
            # Guardar el capítulo anterior si tiene contenido
            if current_chapter_html:
                chapters.append({
                    "title": current_chapter_title,
                    "html_content": "".join(current_chapter_html)
                })
            current_chapter_title = text if text else "Capítulo Sin Título"
            current_chapter_html = []
        else:
            # Convertir formato básico a HTML (negrita, cursiva)
            paragraph_html = []
            for run in p.runs:
                run_text = run.text.replace('<', '&lt;').replace('>', '&gt;')
                if run.bold:
                    run_text = f"<strong>{run_text}</strong>"
                if run.italic:
                    run_text = f"<em>{run_text}</em>"
                paragraph_html.append(run_text)
            
            p_text_html = "".join(paragraph_html)
            if p_text_html.strip():
                current_chapter_html.append(f"<p>{p_text_html}</p>")
                
    # Añadir el último capítulo
    if current_chapter_html:
        chapters.append({
            "title": current_chapter_title,
            "html_content": "".join(current_chapter_html)
        })
        
    # Si por alguna razón está vacío, devolvemos un capítulo genérico
    if not chapters:
        chapters.append({
            "title": "Capítulo 1",
            "html_content": "<p>Documento vacío.</p>"
        })
        
    return chapters

def parse_txt(file_path: str) -> List[Dict[str, str]]:
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
    chapters = []
    current_chapter_title = "Capítulo 1"
    current_chapter_html = []
    
    chapter_regex = re.compile(r'^(#+\s+|capítulo|capitulo|chapter)', re.IGNORECASE)
    
    for line in lines:
        text = line.strip()
        if not text:
            continue
            
        if chapter_regex.match(text):
            if current_chapter_html:
                chapters.append({
                    "title": current_chapter_title,
                    "html_content": "".join(current_chapter_html)
                })
            # Limpiar "# " del título si es markdown
            clean_title = re.sub(r'^#+\s+', '', text)
            current_chapter_title = clean_title if clean_title else "Capítulo Sin Título"
            current_chapter_html = []
        else:
            safe_text = text.replace('<', '&lt;').replace('>', '&gt;')
            current_chapter_html.append(f"<p>{safe_text}</p>")
            
    if current_chapter_html:
        chapters.append({
            "title": current_chapter_title,
            "html_content": "".join(current_chapter_html)
        })
        
    if not chapters:
        chapters.append({
            "title": "Capítulo 1",
            "html_content": "<p>Documento vacío.</p>"
        })
        
    return chapters

def import_document(file_content: bytes, filename: str) -> List[Dict[str, str]]:
    """
    Procesa el documento subido y retorna una lista de capítulos parseados.
    Cada capítulo es un diccionario con 'title' y 'html_content'.
    """
    ext = os.path.splitext(filename.lower())[1]
    
    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4().hex}{ext}")
        with open(input_path, 'wb') as f:
            f.write(file_content)
            
        if ext == '.docx':
            return parse_docx(input_path)
        elif ext in ['.doc', '.odt']:
            docx_path = convert_to_docx(input_path, temp_dir)
            return parse_docx(docx_path)
        elif ext in ['.txt', '.md']:
            return parse_txt(input_path)
        else:
            raise ValueError(f"Formato no soportado: {ext}")
