 
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const testimonials = [
  {
    name: "Ali Madi",
    role: "Propriétaire de magasin",
    content: `Hissab a complètement changé la façon dont je gère mon magasin. 
              La possibilité de suivre les factures, les stock...`,
    bgColor: "bg-blue-500"
  },
  {
    name: "Fatima Ahamada",
    role: "Entrepreneur",
    content: "Hissab est super facile à utiliser et très pratique pour suivre toutes mes ventes et factures.",
    bgColor: "bg-green-500"
  },
  {
    name: "Youssouf Daho",
    role: "Commerçant",
    content: "Le suivi des ventes avec Hissab m'a permis de mieux comprendre mon business et d'améliorer mes profits.",
    bgColor: "bg-purple-500"
  },
  {
    name: "Siti Zaineb",
    role: "Vendeuse",
    content: "Enfin une solution simple pour gérer mon magasin sans tracas.",
    bgColor: "bg-red-500"
  }
];

export default function Testimonials() {
    return (
        <section className="py-16 md:py-32 bg-blue-50" id='testimonials'>
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold mb-4">Fait par des commerçants, apprécié par nos utilisateurs</h2>
                    <p className='text-gray-600'>Hissab aide les commerçants à suivre leurs ventes et factures facilement, tout en gagnant du temps et en simplifiant leur gestion quotidienne.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {testimonials.map((t, idx) => (
                        <Card key={idx} className="flex flex-col h-full">
                            <CardHeader className="flex justify-center ">
                                
                            </CardHeader>
                            <CardContent className="flex flex-col justify-between h-ful">
                                <blockquote className="flex flex-col gap-4">
                                    <p className="text-gray-800">{t.content}</p>
                                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                        <Avatar className="size-12">
                                            <AvatarFallback className={`${t.bgColor} text-white`}>
                                                {t.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <cite className="text-sm font-medium">{t.name}</cite>
                                            <span className="text-muted-foreground block text-sm">{t.role}</span>
                                        </div>
                                    </div>
                                </blockquote>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
