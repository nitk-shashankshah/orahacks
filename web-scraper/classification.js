var {CohereClientV2} = require("cohere-ai");

const cohere = new CohereClientV2({
    token: "2l7u7rXSsFSKEZBC6CGw87kg8iK7JyvadnUzV1Gf",
});

(async () => {
  const classify = await cohere.classify({
    examples: [
      { text: 'Ambitious plans for high-speed rail line in Poland', label: 'Opportunity' },
      { text: 'Indian Railways to expand with USD 30 billion budget allocation', label: 'Opportunity' },
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
