var {CohereClientV2} = require("cohere-ai");

const cohere = new CohereClientV2({
    token: "2l7u7rXSsFSKEZBC6CGw87kg8iK7JyvadnUzV1Gf",
});

(async () => {
  const classify = await cohere.classify({
    examples: [
      { text: 'Apple has announced a $500 billion investment in expanding its US facilities over the next four years, creating 20,000 jobs. This move is seen as a response to President Trumps tariffs on imports from China, as Apple aims to avoid the additional costs. The investment builds upon Apples previous efforts to diversify its supply chain and reduce reliance on China. While the new facilities will take time to become operational, the announcement could help Apple gain favor with the Trump administration and potentially secure exemptions from the China tariffs. The investment includes a new server production facility in Houston, an academy in Detroit, and expanded data center capacity across multiple states. Apples focus on artificial intelligence and smart manufacturing is a key aspect of this investment, with the company aiming to promote advanced technologies and skills development in the US.', label: 'Opportunity' },
      { text: 'Microplastics, tiny plastic particles, are pervasive and pose a significant threat to ecosystems and human health. A research team from Wuhan University has developed a potential solution: a biodegradable sponge made from squid bones and cotton. This sponge, tested in various water samples, effectively removed up to 99.9% of microplastics. The study highlights the urgency of addressing microplastic pollution, which is expected to worsen with increasing plastic production. While the squid-cotton sponge shows promise, concerns remain about its ability to remove sunken microplastics and the proper disposal of absorbed plastics. Experts emphasize the need to prioritize minimizing plastic pollution at its source.', label: 'Spam' },
      { text: 'Augusta railway bypass contract awarded', label: 'Spam' },
      { text: 'COFCO to invest USD 240 million for rail fleet in Brazil', label: 'Competition' },
      { text: 'DB launches Climate Cup to promote sustainable business travel', label: 'Spam' },
      { text: 'Design tenders to be issued for Seville - Huelva HSR', label: 'Opportunity' },
      { text: 'ÖBB hits record for job applications in 2024', label: 'Spam' },
      { text: 'Spain begins tender for telecoms and security maintenance', label: 'Opportunity' },
      { text: 'Chinese firms to build Tanzania-Burundi SGR', label: 'Competition' },
      { text: 'Stadler presents loco features for LTG Cargo', label: 'Spam' },
      { text: 'ALTPRO - 30 years of signalling innovation', label: 'Spam' },
      { text: 'Saarstahl Rail secures major contract with SNCF Réseau',  label: 'Competition' },
      { text: 'Granite secures USD 71 million contract for Fort Bliss expansion', label: 'Competition' },
      { text: 'GDC awards Manhattan Tunnel Project contract',  label: 'Lost Opportunity' },
      { text: 'Adif allocates EUR 660 million for rail maintenance' ,  label: 'Opportunity' },
      { text: 'Augusta railway bypass contract awarded',  label: 'Lost Opportunity' },
      { text: 'Advanced station works for Lodlx tunnel project',  label: 'Spam' },
      { text: 'Track work tender for Murcia – Almería HSR section launched',  label: 'Opportunity' },
      { text: 'Mexico to launch new passenger rail lines by 2027',  label: 'Opportunity' },
      { text: 'Rail Baltica seeks EUR 325 million European co-financing',  label: 'Spam' },
      { text: 'UAE announces high-speed rail link between Abu Dhabi and Dubai',  label: 'Opportunity' },
      { text: 'Trafikverket renews snow clearance contract with Railcare',  label: 'Spam' }
    ],
    inputs: ['Poland seeks contractor for rail access to power plant','Jacobs appointed as Integration Delivery Partner for TRU'],
  });
  console.log(classify);
})();
