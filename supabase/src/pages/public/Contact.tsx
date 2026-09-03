
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Clock, MapPin, Send, ArrowRight, Truck, Phone, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SeoMeta from "@/components/SeoMeta";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const supportInfo = [
  { icon: Mail, label: "Email Us", value: "support@loadsaathi.com", detail: "We respond within 2-4 hours" },
  { icon: MessageSquare, label: "Live Chat", value: "Available 24/7", detail: "Instant responses from our support team" },
  { icon: Clock, label: "Response Time", value: "Under 4 hours", detail: "Average first response time" },
  { icon: MapPin, label: "Office", value: "Foundation for Technology and Business Incubation (FTBI)", detail: "First Floor, T1-109, NIT Rourkela, Sector 1, Rourkela, Odisha 769008" },
];

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>Contact LoadSaathi — Get in Touch</h1>
          <p>Have questions or need support? Contact LoadSaathi's team for demos, technical support, partnerships, or general inquiries.</p>
          <h2>General Inquiries</h2>
          <p><strong>Email:</strong> hello@loadsaathi.in</p>
          <p><strong>Phone:</strong> +91-XXXXXXXXXX</p>
          <p><strong>Hours:</strong> Monday to Saturday, 9:00 AM - 7:00 PM IST</p>
          <h2>Head Office</h2>
          <p><strong>Address:</strong> LoadSaathi Technologies Pvt. Ltd., Near NIT Rourkela, Rourkela, Odisha 769008, India</p>
          <h2>Regional Offices</h2>
          <ul>
            <li><strong>Delhi NCR:</strong> Plot No. 15, Sector 44, Gurugram, Haryana 122003</li>
            <li><strong>Mumbai:</strong> 701, 7th Floor, Ackruti Cosmos, MIDC, Andheri East, Mumbai 400093</li>
            <li><strong>Bengaluru:</strong> 3rd Floor, Prestige Towers, Residency Road, Bengaluru 560025</li>
          </ul>
          <h2>Specialized Contacts</h2>
          <ul>
            <li><strong>Technical Support:</strong> support@loadsaathi.in</li>
            <li><strong>Sales &amp; Demos:</strong> sales@loadsaathi.in</li>
            <li><strong>Partnerships:</strong> partnerships@loadsaathi.in</li>
            <li><strong>Media &amp; PR:</strong> press@loadsaathi.in</li>
            <li><strong>Careers:</strong> careers@loadsaathi.in</li>
          </ul>
          <h2>Connect on Social Media</h2>
          <ul>
            <li>LinkedIn, Twitter, YouTube, Facebook — @LoadSaathi</li>
          </ul>
          <h2>What You Can Contact Us About</h2>
          <ul>
            <li>Product demos and walkthroughs</li>
            <li>Account or technical support</li>
            <li>Partnership inquiries</li>
            <li>Media requests and interviews</li>
            <li>Career opportunities</li>
          </ul>
        </div>
      </noscript>
      <SeoMeta
        title="Contact Us — Get in Touch"
        description="Reach out to LoadSaathi's support team. We're available 24/7 via email, phone, or our contact form. Get help with shipments, account issues, or partnership inquiries."
        keywords="contact LoadSaathi, freight support India, logistics help, trucking platform support"
        canonical="/contact"
        breadcrumbs={[{ name: "Contact", url: "/contact" }]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[400px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.15]"
            style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 w-fit mb-6">
              <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                Get in Touch
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Let&apos;s <span className="text-gradient-orange-blue">talk</span>.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Have a question, feedback, or want to learn more about LoadSaathi? We&apos;d love to hear from you. Our team typically responds within 2-4 hours.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT FORM & INFO */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="glass-card p-8 sm:p-10 rounded-xl border-border dark:border-white/[0.08]">
                <h2 className="text-2xl font-black text-foreground mb-6">Send Us a Message</h2>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <Send className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">Thank you for reaching out. Our team will get back to you within 2-4 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="bg-background dark:bg-[#0B1220] border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="bg-background dark:bg-[#0B1220] border-border"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                      <Input
                        id="subject"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="bg-background dark:bg-[#0B1220] border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about what you're looking for..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        className="bg-background dark:bg-[#0B1220] border-border resize-none"
                      />
                    </div>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] w-full sm:w-auto">
                      Send Message <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="lg:col-span-2 space-y-4">
              {supportInfo.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08] hover:border-orange-500/30 transition-all duration-300 group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-600/10 dark:bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
                        <div className="text-sm font-bold text-foreground">{item.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.detail}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08] mt-6">
                <h3 className="text-sm font-bold text-foreground mb-3">Business Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="text-foreground font-medium">9:00 AM - 6:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="text-foreground font-medium">10:00 AM - 2:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="text-foreground font-medium">Closed (Chat support available)</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-orange-500/10 bg-orange-500/5 mt-6">
                <h3 className="text-sm font-bold text-foreground mb-2">Enterprise Inquiries</h3>
                <p className="text-xs text-muted-foreground mb-3">Looking to integrate LoadSaathi with your existing systems or need a custom solution?</p>
                <a href="mailto:enterprise@loadsaathi.com" className="text-sm text-orange-500 hover:text-orange-400 font-semibold underline underline-offset-2">
                  enterprise@loadsaathi.com
                </a>
              </div>
            </div>
          </div>

          {/* Leadership Team */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Leadership Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Meet the people building India&apos;s smart freight network.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* CEO */}
              <div className="glass-card p-8 rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-28 h-28 ring-2 ring-orange-500/25 ring-offset-2 ring-offset-background transition-all duration-500 group-hover:ring-orange-500/60 group-hover:shadow-lg group-hover:shadow-orange-500/10">
                    <AvatarImage className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.08]" src="/team/sanjaya-sahu.webp" alt="Sanjaya Sahu" />
                    <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-4xl font-black text-orange-600 dark:text-orange-400">SS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Sanjaya Sahu</h3>
                    <p className="text-sm text-muted-foreground">Founder & CEO</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Building LoadSaathi to bridge the gap between shippers and truckers with technology, not intermediaries.
                </p>
                <div className="space-y-3">
                  <a href="tel:+918328998031" className="flex items-center gap-3 text-sm text-foreground hover:text-orange-500 transition-colors group/link">
                    <Phone className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>+91 83289 98031</span>
                  </a>
                  <a href="https://www.linkedin.com/in/sanjaya-sahu-253315305/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-orange-500 transition-colors group/link">
                    <Linkedin className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>LinkedIn Profile</span>
                  </a>
                </div>
              </div>

              {/* COO */}
              <div className="glass-card p-8 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-28 h-28 ring-2 ring-blue-500/25 ring-offset-2 ring-offset-background transition-all duration-500 group-hover:ring-blue-500/60 group-hover:shadow-lg group-hover:shadow-blue-500/10">
                    <AvatarImage className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.08]" src="/team/prince-mallik.webp" alt="Prince Mallik" />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-4xl font-black text-blue-600 dark:text-blue-400">PM</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Prince Mallik</h3>
                    <p className="text-sm text-muted-foreground">Co-Founder & COO</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Driving operations and growth to ensure LoadSaathi delivers seamless freight experiences across East India.
                </p>
                <div className="space-y-3">
                  <a href="tel:+917684843985" className="flex items-center gap-3 text-sm text-foreground hover:text-blue-500 transition-colors group/link">
                    <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>+91 76848 43985</span>
                  </a>
                  <a href="https://www.linkedin.com/in/prince-mallik-177a472a0/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-blue-500 transition-colors group/link">
                    <Linkedin className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>LinkedIn Profile</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-24 relative overflow-hidden bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10 text-center">
          <Truck className="h-10 w-10 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">Join India&apos;s intelligent freight network today.</p>
          <Link to="/register">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
    </>
  );
};

export default Contact;
