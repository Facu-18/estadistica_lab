import facundoPortrait from '../../assets/teachers/facundo-moriconi.svg'
import francoPortrait from '../../assets/teachers/franco-aguirre.svg'

export const teachers = {
  facundo: { id: 'facundo', name: 'Facundo Moriconi', portrait: facundoPortrait },
  franco: { id: 'franco', name: 'Franco Aguirre', portrait: francoPortrait },
} as const

export type TeacherId = keyof typeof teachers
