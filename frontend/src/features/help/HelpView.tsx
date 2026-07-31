import React, { useState } from 'react';
import { Book, Edit3, Library, Bot, Download, ChevronDown, ChevronRight, Zap, Target } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface HelpSectionProps {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

function HelpSection({ title, icon, items }: HelpSectionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 text-[#6366f1]">
        {icon}
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const isOpen = openItems.includes(item.id);
          return (
            <div 
              key={item.id} 
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <span className="font-medium text-[var(--color-text-primary)]">{item.question}</span>
                <div className="text-[var(--color-text-secondary)]">
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>
              {isOpen && (
                <div className="p-4 pt-0 text-sm text-[var(--color-text-secondary)] leading-relaxed prose prose-invert max-w-none prose-p:text-[var(--color-text-secondary)]">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HelpView() {
  const sections: HelpSectionProps[] = [
    {
      title: 'Primeros Pasos y Proyectos',
      icon: <Book size={24} />,
      items: [
        {
          id: 'proj-1',
          question: '¿Cómo creo y organizo mi manuscrito?',
          answer: (
            <div>
              <p>Atramentum utiliza una estructura de árbol tradicional para organizar tu obra:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Proyectos:</strong> Son los libros individuales. Puedes crear múltiples proyectos desde la barra lateral izquierda seleccionando "Nuevo Proyecto".</li>
                <li><strong>Actos:</strong> Las grandes divisiones de tu historia (Ej. Planteamiento, Nudo, Desenlace).</li>
                <li><strong>Capítulos:</strong> Las subdivisiones principales de cada Acto.</li>
                <li><strong>Escenas:</strong> La unidad mínima donde escribes. Cada escena puede tener su propio título y objetivo.</li>
              </ul>
              <p className="mt-2">Puedes renombrar cualquier elemento haciendo doble clic sobre su nombre en la barra lateral del Editor.</p>
            </div>
          )
        }
      ]
    },
    {
      title: 'El Editor de Texto',
      icon: <Edit3 size={24} />,
      items: [
        {
          id: 'edit-1',
          question: '¿Cómo funciona el autoguardado?',
          answer: <p>Atramentum guarda tu progreso automáticamente cada vez que dejas de escribir por más de 1 segundo. Verás un indicador de "Guardado ✓" en la barra superior derecha.</p>
        },
        {
          id: 'edit-2',
          question: '¿Qué es el Modo de Concentración (Focus Mode)?',
          answer: <p>Para eliminar todas las distracciones de la interfaz, presiona <strong>F11</strong> o haz clic en el botón de expandir en la barra de herramientas del editor. La interfaz colapsará la barra lateral, cabeceras y herramientas, dándote un entorno de escritura centrado inspirado en los procesadores retro de MS-DOS.</p>
        },
        {
          id: 'edit-3',
          question: 'Edición y reescritura asistida (Varita Mágica)',
          answer: <p>Selecciona cualquier fragmento de texto que hayas escrito y haz clic en el icono de la varita mágica que aparecerá sobre el texto. Escribe una instrucción (Ej. "Haz que suene más tenebroso" o "Corrige la ortografía") y la IA reescribirá exactamente esa porción.</p>
        }
      ]
    },
    {
      title: 'El Archivum (Bíblia de la Historia)',
      icon: <Library size={24} />,
      items: [
        {
          id: 'arch-1',
          question: '¿Qué es el Archivum y cómo lo uso?',
          answer: <p>El Archivum es la enciclopedia personal de tu libro. Aquí puedes crear fichas para Personajes, Lugares, Objetos y Conceptos (Lore). Lo importante es que <strong>la IA (AtrIA) lee tu Archivum</strong> para entender de qué estás hablando cuando mencionas a un personaje en el chat o pides ayuda para redactar.</p>
        },
        {
          id: 'arch-2',
          question: 'Escaneo de personajes automático',
          answer: <p>Si tienes un texto que ya incluye muchos personajes, puedes usar el botón de "Escanear y Extraer" en el Archivum. AtrIA leerá toda tu escena actual, detectará qué personajes mencionaste y creará automáticamente sus fichas por ti.</p>
        }
      ]
    },
    {
      title: 'AtrIA: Asistente Inteligente y Chat',
      icon: <Bot size={24} />,
      items: [
        {
          id: 'atria-1',
          question: '¿Cómo funciona la Búsqueda Semántica de AtrIA?',
          answer: <p>AtrIA es diferente a un chat tradicional como ChatGPT. Al escribir, el sistema guarda "firmas matemáticas" (Vectores) de tus escenas. Cuando le preguntas a AtrIA algo como <em>"¿Qué le dijo el rey a Juan en el bosque?"</em>, AtrIA rastrea secretamente todos los capítulos de tu libro, encuentra el fragmento donde ocurrió y te responde con total precisión, sin importar cuán largo sea tu manuscrito.</p>
        },
        {
          id: 'atria-2',
          question: '¿Para qué sirve el botón de Ajustes de Contexto (⚙️)?',
          answer: (
            <div>
              <p>Si quieres que la IA se enfoque o que ignore cierta información, puedes apagar/encender módulos:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Archivum:</strong> Desactívalo si no quieres que la IA use el lore de la historia.</li>
                <li><strong>Escenas Relevantes:</strong> Apágalo si quieres una charla general que no rastree todo tu libro (ahorra memoria).</li>
                <li><strong>Beats:</strong> Apágalo si no quieres que considere la lista de cosas "por hacer" en la escena actual.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'atria-3',
          question: '¿Qué son los Roles o Personalidades (Persona)?',
          answer: (
            <div>
              <p>Puedes cambiar la actitud de AtrIA utilizando el menú desplegable en el panel de Chat:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Co-Escritor:</strong> La opción por defecto. Amigable, creativo y proactivo.</li>
                <li><strong>Crítico:</strong> Estricto. Buscará fallos en tu ritmo, prosa y agujeros en la trama (Plot Holes).</li>
                <li><strong>Lector de Prueba:</strong> Reacciona como un fan entusiasta de tu historia.</li>
                <li><strong>Editor:</strong> Se enfoca únicamente en el tono, la gramática y el estilo técnico.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'atria-4',
          question: 'Generación por Beats (Generar con AtrIA)',
          answer: <p>En la barra lateral derecha (Inspector), verás la sección de <strong>Beats</strong>. Los beats son instrucciones de lo que debe ocurrir (Ej. "Juan entra al bar. Pide una cerveza. Alguien dispara"). Si los escribes y le das clic a "Generar escena con AtrIA", la IA redactará la prosa combinando esos beats con el lore de tu Archivum.</p>
        }
      ]
    },
    {
      title: 'Exportación y Productividad',
      icon: <Zap size={24} />,
      items: [
        {
          id: 'exp-1',
          question: 'Estadísticas y Metas',
          answer: <p>Haz clic en "Estadísticas" en la esquina inferior izquierda. Podrás establecer una meta global de palabras para tu novela. La aplicación calculará cuántas palabras llevas en todo el manuscrito y te mostrará el porcentaje completado en tiempo real.</p>
        },
        {
          id: 'exp-2',
          question: '¿A qué formatos puedo exportar mi libro?',
          answer: (
            <p>Desde la sección de "Gestionar Proyectos" (o desde la pantalla de bienvenida), puedes hacer clic en el botón de Exportar de un proyecto. Atramentum unirá todos tus Actos, Capítulos y Escenas ordenadamente en un único archivo. Soporta: <strong>Markdown (.md)</strong>, <strong>Word (.docx)</strong>, <strong>PDF</strong> y <strong>EPUB</strong> (Listo para leer en Kindle).</p>
          )
        }
      ]
    }
  ];

  return (
    <div className="h-full bg-[var(--color-background)] overflow-y-auto">
      <div className="max-w-4xl mx-auto py-12 px-8">
        
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-[#6366f1]/10 text-[#6366f1] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target size={32} />
          </div>
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">Guía de Uso Atramentum</h1>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
            Descubre todas las herramientas y trucos para sacarle el máximo partido a tu asistente de escritura.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sections.map((section, idx) => (
            <HelpSection 
              key={idx}
              title={section.title}
              icon={section.icon}
              items={section.items}
            />
          ))}
        </div>
        
        <div className="mt-16 text-center text-sm text-[var(--color-text-secondary)] pb-8 opacity-75">
          <p>Atramentum v1.0 • Guía actualizada automáticamente</p>
        </div>
      </div>
    </div>
  );
}
