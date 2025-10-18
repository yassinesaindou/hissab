import Link from "next/link";

const LastCTA = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-12 lg:px-5">
        <div className="w-full relative py-8 md:py-10 px-6 md:px-8 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-900">
          
          {/* Top-right floating shapes */}
          <div className="absolute right-0 top-0 h-full w-full flex justify-end">
            <div className="w-28 h-28 overflow-hidden flex rounded-xl relative blur-2xl">
              <span className="absolute w-16 h-16 -top-1 -right-1 bg-blue-500 rounded-md rotate-45" />
              <span className="absolute w-16 h-16 -bottom-1 -right-1 bg-teal-500 rounded-md rotate-45" />
              <span className="absolute w-16 h-16 -bottom-1 -left-1 bg-indigo-300 rounded-md rotate-45" />
            </div>
          </div>

          {/* Bottom-left floating shapes */}
          <div className="absolute left-0 bottom-0 h-full w-full flex items-end">
            <div className="w-28 h-28 overflow-hidden flex rounded-xl relative blur-2xl">
              <span className="absolute w-16 h-16 -top-1 -right-1 bg-blue-500 rounded-md rotate-45" />
              <span className="absolute w-16 h-16 -bottom-1 -right-1 bg-teal-500 rounded-md rotate-45" />
              <span className="absolute w-16 h-16 -bottom-1 -left-1 bg-indigo-300 rounded-md rotate-45" />
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto text-center max-w-xl md:max-w-2xl relative space-y-8">
            <h1 className="text-2xl font-bold mb-4">
              Gérez vos ventes et factures facilement avec{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 from-20% via-indigo-400 via-30% to-teal-600">
                Hissab
              </span>
            </h1>
            <p className='text-gray-600'>
              Simplifiez la gestion de votre magasin : suivez vos ventes, vos factures et vos clients en un seul endroit. Hissab vous aide à gagner du temps et à améliorer votre productivité.
            </p>

            <div className="mx-auto max-w-md sm:max-w-xl flex justify-center">
              <Link href="/signup" className="h-12 px-5 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                Commencer Gratuitement
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LastCTA;
