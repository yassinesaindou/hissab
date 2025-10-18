import Link from "next/link";

const PricingSection = () => {
  return (
    <section className="py-32" id="pricing">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-16">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
            Tarifs
          </span>
          <h2 className="text-2xl font-bold mb-4">Nos forfaits Hissab</h2>
          <p className="max-w-2xl text-gray-700">
            Choisissez le forfait qui correspond à votre boutique et commencez à
            gérer vos ventes dès aujourd&apos;hui.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 flex flex-col text-center shadow-md hover:shadow-lg transition">
            <span className="text-2xl font-semibold text-gray-900">
              Starter
            </span>
            <div className="mt-3 text-3xl font-bold text-blue-600 flex gap-2 items-baseline mx-auto">
              4 000 Kmf <p className="text-lg font-medium">mensuel</p>
            </div>
            <p className="mt-4 text-gray-600">
              Idéal pour les petites boutiques qui débutent avec Hissab.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-gray-600">
              {[
                "1 Utilisateur",
                "Enregistez vos products",
                "Rapports avancés",
                "60 transactions par Jour",
                "Suivi des ventes quotidien",
                "Gestion des stock limitée",
                "Exportation de données via excel",
                "Support par email",
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 ">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 111.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>
            <Link prefetch={false}
              href="/signup"
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition">
              Commencer
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-blue-600 p-8 rounded-3xl border border-blue-700 flex flex-col text-center shadow-md transform scale-105 hover:scale-105 transition">
            <span className="text-2xl font-semibold text-white">Pro</span>
            <div className="mt-3 mx-auto text-3xl font-bold text-white flex gap-2 items-baseline">9 500 Kmf
               <p className="text-lg font-medium">mensuel</p>
            </div>
            <p className="mt-4 text-blue-100">
              Pour les boutiques en croissance qui ont besoin de plus de
              flexibilité et de support.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-blue-100">
              {[
                "3 Utilisateurs (2 Caissier(e)s)",
                "Suivi des ventes quotidien",
                "Enregistez tous vos articles",
                "Rapports avancés",
                "Création illimitée des factures",
                "250 transactions par Jour",
                "Gestion des stock",
                "Exportation de données via excel",
                "Support prioritaire",
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 ">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 111.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>
            <Link prefetch={false}
              href="/signup"
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-full font-medium hover:opacity-90 transition">
              Commencer
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 flex flex-col text-center shadow-md hover:shadow-lg transition">
            <span className="text-2xl font-semibold text-gray-900">
              Enterprise
            </span>
            <div className="mt-3 text-3xl font-bold text-blue-600 flex gap-2 items-baseline mx-auto">
              20 000 Kmf <p className="text-lg font-medium">mensuel</p>
            </div>
            <p className="mt-4 text-gray-600">
              Pour les grandes entreprises et équipes nécessitant toutes les
              fonctionnalités et support complet.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-gray-600">
              {[
                "Jusqu'a 10 Utilisateurs",
                "Suivi des ventes quotidien",
                "Enregistez tous vos articles",
                "Rapports avancés",
                "Création illimitée des factures",
                "650 transactions par Jour",
                "Gestion des stock",
                "Exportation de données via excel",
                "Formation pour vos équipes",
                "Support dédié 24/7",
              ].map((feat, idx) => (
                <li key={idx} className="flex gap-2 ">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 111.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>
            <Link prefetch={false}
              href="/signup"
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition">
              Commencer
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
