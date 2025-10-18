import { User, Store, Activity } from 'lucide-react';

const steps = [
  {
    title: "Créer un compte",
    description: "Inscrivez-vous sur Hissab pour commencer à gérer votre boutique.",
    icon: <User />
  },
  {
    title: "Configurer votre boutique",
    description: "Ajoutez vos produits, configurez vos stocks et personnalisez votre boutique.",
    icon: <Store />
  },
  {
    title: "Commencez à facturer",
    description: "Créez vos premières factures, suivez vos ventes et optimisez vos opérations.",
    icon: <Activity />
  }
];

export default function Steps() {
  return (
    <section id='steps' className="px-4 sm:px-6 lg:px-8 py-16 md:py-32 max-w-7xl mx-auto">
      {/* Title + description */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-4">Comment démarrer avec Hissab</h2>
        <p className="text-gray-600">
          Suivez ces étapes simples pour gérer votre boutique efficacement avec notre POS.
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 lg:gap-24">
        {steps.map((step, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold">{step.icon}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
