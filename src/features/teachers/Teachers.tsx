import { GraduationCap } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { TeacherExplanation } from '../../components/TeacherExplanation'
import { teachers } from './data'

export function Teachers() {
  return <div className="module-content teachers-module">
    <div className="intro-line"><span className="eyebrow">APRENDER CON ACOMPAÑAMIENTO</span><span className="topic-tag"><GraduationCap size={15} />Estadística y Probabilidad Aplicada</span></div>
    <div className="page-title"><div><h1>Conocé a tus profesores<span>.</span></h1><p>Facundo y Franco acompañan las explicaciones de tu laboratorio.</p></div></div>
    <div className="teachers-grid">{Object.values(teachers).map((teacher, index) => <Card key={teacher.id} className={`teacher-profile teacher-${teacher.id}`}>
      <CardContent><article aria-label={`Perfil de ${teacher.name}`}>
        <div className="teacher-profile-top"><span className="teacher-profile-label"><GraduationCap size={15} />Profesor</span><span className="teacher-profile-number">0{index + 1}</span></div>
        <div className="teacher-portrait-wrap"><img src={teacher.portrait} alt={teacher.name} width={208} height={208} className="teacher-portrait" /></div>
        <h2>{teacher.name}</h2><p className="teacher-course">Estadística y Probabilidad Aplicada</p>
        <div className="teacher-profile-caption"><TeacherExplanation title={`Acerca de ${teacher.name}`} teacher={teacher.id}><p>Una guía visual para acompañar la lectura de conceptos, procedimientos y resultados dentro del software.</p></TeacherExplanation></div>
      </article></CardContent>
    </Card>)}</div>
    <TeacherExplanation title="Cómo te acompañan los profesores" teacher="franco"><p>Encontrá a Facundo o Franco en los botones de ayuda de estadística, los gráficos y los eventos de probabilidad. Sus ilustraciones ayudan a identificar las orientaciones del laboratorio.</p></TeacherExplanation>
    <p className="teacher-disclaimer">Las explicaciones son contenido educativo del software; no son citas textuales ni declaraciones personales de los docentes.</p>
  </div>
}
