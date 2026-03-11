export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <span className="text-xl font-bold text-white mb-2 block">Flowly</span>
            <p className="text-slate-400 text-sm">Join our team of passionate builders.</p>
          </div>
          <div className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Flowly. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
