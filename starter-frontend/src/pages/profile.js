import React from "react";

const Profile = () => {
  return (
    <div className="bg-pure-black text-white min-vh-100 py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="text-success display-4 fw-bold mb-3">About Stock Overflow</h1>
          <p className="lead text-secondary mb-4">
            Empowering investors through data-driven analysis and transparent insights.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-dark border border-secondary rounded p-4 mb-5">
          <h2 className="text-white mb-4 text-center">Independent Stock Analysis & Valuation</h2>
          <p className="text-secondary text-center">
            At Stock Overflow, we provide unbiased, data-driven stock analysis using advanced DCF models and fundamental research.
            Our mission is to cut through market noise and deliver clear, actionable investment insights to help you make informed decisions.
          </p>
        </div>


        {/* Methodology Section */}
        <div className="bg-dark border border-secondary rounded p-4 mb-5">
          <h2 className="text-white mb-4 text-center">Our Methodology</h2>
          {[
            {
              title: "1. Fundamental Analysis",
              text: "We start with a comprehensive review of company financials, competitive positioning, and industry dynamics to understand the business model and growth prospects."
            },
            {
              title: "2. DCF Modeling",
              text: "Our proprietary DCF models incorporate detailed cash flow projections, appropriate discount rates, and terminal value calculations to determine intrinsic value."
            },
            {
              title: "3. Risk Assessment",
              text: "We evaluate company-specific and macro risks, incorporating them into our models and providing clear explanations of potential headwinds and catalysts."
            },
            {
              title: "4. Continuous Monitoring",
              text: "Our valuations are regularly updated based on new information, earnings reports, and changing market conditions to ensure accuracy and relevance."
            }
          ].map((step, index) => (
            <div className="mb-4" key={index}>
              <h5 className="text-white">{step.title}</h5>
              <p className="text-secondary">{step.text}</p>
            </div>
          ))}
        </div>

        {/* Team Section */}
        <div className="bg-dark border border-secondary rounded p-4 mb-5">
          <h2 className="text-white mb-4 text-center">Meet the Team</h2>
          <div className="row g-4">
            {[
              {
                name: "Full Name",
                title: "Chief Investment Officer",
                bio: "15+ years at Goldman Sachs, CFA",
                initials: "Initial",
              },
              {
                name: "Full Name",
                title: "Senior Analyst",
                bio: "Former McKinsey, PhD Finance",
                initials: "Initial",
              },
              {
                name: "Full Name",
                title: "Quantitative Analyst",
                bio: "Former Two Sigma, MIT graduate",
                initials: "Initial",
              },
              {
                name: "Full Name",
                title: "Quantitative Analyst",
                bio: "Former Two Sigma, MIT graduate",
                initials: "Initial",
              },
              {
                name: "Full Name",
                title: "Quantitative Analyst",
                bio: "Former Two Sigma, MIT graduate",
                initials: "Initial",
              },
            ].map((member, index) => (
              <div className="col-md-4 text-center" key={index}>
                <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 80, height: 80 }}>
                  <span className="text-white fw-bold">{member.initials}</span>
                </div>
                <h5 className="text-success">{member.name}</h5>
                <p className="text-white mb-1">{member.title}</p>
                <p className="text-secondary small">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;