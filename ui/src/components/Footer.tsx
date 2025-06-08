import { Link } from "react-router"

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white py-4 flex flex-row justify-between items-center px-8">
            <div className="">
                <img src="/src/assets/hodl-logo-light.png" alt="Hodl" className="w-22" />
            </div>
            <div className="flex flex-row justify-center items-center gap-8">
                <Link to="/">
                    <p className="text-sm">FAQ</p>
                </Link>
                <Link to="/">
                    <p className="text-sm">Contact</p>
                </Link>
                <Link to="/">
                    <p className="text-sm">Terms of Service</p>
                </Link>
                <Link to="/">
                    <p className="text-sm">Privacy Policy</p>
                </Link>
            </div>
        </footer>
    )
}
