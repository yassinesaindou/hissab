'use client'
import Link from "next/link";

const CtaSection = () => {
  return (
    <section className="py-24 bg-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Heading */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          Essayez Hissab gratuitement
        </h2>

        {/* Description */}
        <p className="text-gray-600 max-w-xl mx-auto mb-8">
          Gérez vos ventes, suivez vos stocks et créez vos factures facilement avec Hissab. Commencez dès aujourd&apos;hui sans risque !
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link  prefetch={false}
            href="/signin"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium shadow-md hover:bg-blue-700 transition"
          >
            Commencer
          </Link>
          <Link  prefetch={false}
            href="/signup"
            className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-100 transition"
          >
            Découvrir Hissab
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
