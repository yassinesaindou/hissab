import {
  BatteryCharging,
  GitPullRequest,
  Layers,
  RadioTower,
  SquareKanban,
  WandSparkles,
} from "lucide-react";

interface Reason {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Feature43Props {
  heading?: string;
  reasons?: Reason[];
}

const Features = ({
  heading = "Pourquoi choisir Hissab ?",
  reasons = [
    {
      title: "Gestion des ventes",
      description:
        "Suivez toutes vos ventes en temps réel, simplifiez les transactions et améliorez la satisfaction de vos clients.",
      icon: <GitPullRequest className="size-6 text-green-400" />,
    },
    {
      title: "Suivi des stocks",
      description:
        "Gardez un œil sur vos stocks, recevez des alertes de rupture et optimisez vos approvisionnements.",
      icon: <SquareKanban className="size-6 text-yellow-400" />,
    },
    {
      title: "Rapports détaillés",
      description:
        "Générez facilement des rapports sur vos ventes, vos produits et vos performances commerciales.",
      icon: <RadioTower className="size-6 text-shadow-blue-500" />,
    },
    {
      title: "Gestion des factures",
      description:
        "Créez et suivez vos factures facilement, pour garder le contrôle sur vos encaissements et relances.",
      icon: <WandSparkles className="size-6 text-orange-400" />,
    },
    {
      title: "Multi-utilisateurs",
      description:
        "Attribuez des rôles à vos employés et contrôlez leurs accès selon leurs responsabilités.",
      icon: <Layers className="size-6 text-violet-400" />,
    },
    {
      title: "Performance et fiabilité",
      description:
        "Hissab est rapide, fiable et disponible 24/7 pour votre boutique.",
      icon: <BatteryCharging className="size-6 text-pink-400" />,
    },
  ],
}: Feature43Props) => {
  return (
    <section id="features" className="bg-blue-50 py-16 md:py-32 sm:px-6 lg:px-8">
      <section className=" max-w-[1140px] mx-auto px-4 ">
        {/* Heading */}
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-2xl font-bold mb-4">{heading}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez pourquoi les commerçants choisissent Hissab pour gérer leur boutique efficacement.
          </p>
        </div>
        {/* Features grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, i) => (
            <div key={i} className="flex flex-col text-center bg-gray-50 p-4 rounded-xl shadow-md" >
              <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent mx-auto">
                {reason.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{reason.title}</h3>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

export { Features as Features };
