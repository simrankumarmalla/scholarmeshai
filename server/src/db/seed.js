import bcrypt from 'bcryptjs';
import db from '../config/db.js';

export async function seedDemoData() {
  try {
    // Check if demo user already exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', ['demo@scholarmesh.ai']);
    if (existing.rows && existing.rows.length > 0) {
      console.log('[ScholarMesh DB] Demo researcher account already seeded.');
      return existing.rows[0];
    }

    console.log('[ScholarMesh DB] Seeding initial demo researcher and multi-source workspace...');

    // 1. Create Demo User
    const passwordHash = await bcrypt.hash('DemoPass123!', 10);
    const userRes = await db.query(
      `INSERT INTO users (full_name, email, password_hash, institution, research_role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        'Dr. Elena Vance',
        'demo@scholarmesh.ai',
        passwordHash,
        'Max Planck Institute for Molecular Biomedicine',
        'Principal Investigator'
      ]
    );
    const user = userRes.rows[0];

    // 2. Create Pre-populated Workspace
    const wsRes = await db.query(
      `INSERT INTO workspaces (user_id, title, domain, research_question, working_hypothesis, default_synthesis_mode)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        user.id,
        'mRNA Delivery Lipid Nanoparticles: Efficacy vs. Hepatic Toxicity',
        'biomedical_clinical',
        'What is the optimal ionizable lipid pKa threshold for achieving high mRNA translation efficiency while preventing acute hepatic toxicity and inflammatory cytokine cascade?',
        'Lipid nanoparticles with ionizable lipid pKa between 6.2 and 6.5 maximize endosomal escape while demonstrating a 40% reduction in ALT/AST elevation compared to higher pKa formulations.',
        'contradiction_audit'
      ]
    );
    const workspace = wsRes.rows[0];

    // 3. Create Source 1
    const s1Res = await db.query(
      `INSERT INTO sources (workspace_id, user_id, title, authors, publication_year, source_type, original_filename, raw_content, word_count, ai_summary, methodology_notes, rigor_score, rigor_justification, key_topics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspace.id,
        user.id,
        'Optimization of Ionizable Cationic Lipids for Splenic and Hepatic mRNA Delivery',
        'Vance, E., Chen, K., & Arisawa, T.',
        2024,
        'peer_reviewed_paper',
        'vance_2024_ionizable_lipids.pdf',
        'This investigation evaluates a novel library of ionizable cationic lipids with systematically tuned acid dissociation constants (pKa ranging from 5.8 to 7.2). We analyzed functional delivery of luciferase mRNA in rodent and non-human primate models. Formulations featuring an apparent pKa of 6.4 exhibited a 4.2-fold enhancement in endosomal escape efficiency and sustained hepatic translation. Strikingly, hepatic enzyme panels demonstrated that serum ALT elevations remained within normal physiological ranges (<45 U/L) at therapeutic mRNA doses of 0.5 mg/kg. Biodistribution was predominantly localized to hepatocytes with minimal splenic sequestration.',
        110,
        'Demonstrates that ionizable lipids with pKa 6.4 provide optimal endosomal escape and 4.2-fold enhanced hepatocyte translation without exceeding normal physiological ALT boundaries (<45 U/L) at 0.5 mg/kg.',
        'Randomized, controlled in vivo study across murine (n=60) and Cynomolgus macaque (n=12) cohorts with mass spectrometry biodistribution and comprehensive serum chemistry assays.',
        88,
        'High statistical power, multi-species validation (rodent and NHP), robust histological toxicity controls.',
        JSON.stringify(['Ionizable Lipids', 'mRNA Delivery', 'Endosomal Escape', 'Hepatic Clearance', 'Lipid Nanoparticles'])
      ]
    );
    const s1 = s1Res.rows[0];

    // Source 1 Claims
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s1.id, workspace.id, user.id, 'Ionizable lipids with apparent pKa of 6.4 demonstrated 4.2-fold higher mRNA translation in hepatocytes compared to pKa 6.8 formulations.', 'empirical_finding', 'Formulations featuring an apparent pKa of 6.4 exhibited a 4.2-fold enhancement in endosomal escape efficiency', 'high']
    );
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s1.id, workspace.id, user.id, 'Serum ALT elevations remained within normal physiological range (<45 U/L) at therapeutic mRNA doses of 0.5 mg/kg.', 'statistic', 'serum ALT elevations remained within normal physiological ranges (<45 U/L) at therapeutic mRNA doses of 0.5 mg/kg', 'high']
    );
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s1.id, workspace.id, user.id, 'Long-term cumulative hepatic toxicity beyond 28 days of repeated bi-weekly administration was unexamined.', 'limitation', 'Biodistribution was predominantly localized to hepatocytes with minimal splenic sequestration (single-dose evaluation)', 'medium']
    );

    // 4. Create Source 2 (Conflicting Study)
    const s2Res = await db.query(
      `INSERT INTO sources (workspace_id, user_id, title, authors, publication_year, source_type, original_filename, raw_content, word_count, ai_summary, methodology_notes, rigor_score, rigor_justification, key_topics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspace.id,
        user.id,
        'Dose-Limiting Hepatotoxicity and Inflammatory Cytokine Release in High-Efficiency LNP Formulations',
        'Kowalski, P., Thorne, M., & Zhao, Y.',
        2023,
        'peer_reviewed_paper',
        'kowalski_2023_hepatotoxicity.pdf',
        'A critical barrier in synthetic lipid nanoparticle translation is acute immune activation. In this evaluation of commercial and candidate LNPs, we observed that candidate ionizable lipids with pKa below 6.5 elicited marked dose-limiting hepatotoxicity in murine models. Rapid bolus tail-vein administration of 0.3 mg/kg mRNA resulted in acute ALT/AST surges exceeding 320 U/L within 6 hours post-infusion. Histological examination revealed extensive Kupffer cell pyroptosis and microsteatosis. Circulating IL-6 and TNF-alpha peaked at 12-fold baseline, indicating a severe systemic cytokine reaction triggered by unshielded surface charge.',
        105,
        'Reports that candidate ionizable lipids with pKa < 6.5 cause acute dose-limiting hepatotoxicity (ALT >320 U/L) and severe inflammatory cytokine release (IL-6 surge) within 6 hours at 0.3 mg/kg.',
        'Murine in vivo trial (n=85) testing rapid bolus tail-vein injections of candidate LNPs with cytokine ELISA profiling and liver histology at 6, 24, and 72 hours.',
        82,
        'Detailed early-stage inflammatory profiling and histology, though limited to murine bolus injections without slow-infusion clinical modeling.',
        JSON.stringify(['Hepatotoxicity', 'Cytokine Storm', 'Kupffer Cells', 'ALT/AST Elevation', 'Dose-Limiting Toxicity'])
      ]
    );
    const s2 = s2Res.rows[0];

    // Source 2 Claims
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s2.id, workspace.id, user.id, 'Candidate ionizable lipids with pKa below 6.5 induced severe transient hepatotoxicity and Kupffer cell activation at 0.3 mg/kg.', 'empirical_finding', 'candidate ionizable lipids with pKa below 6.5 elicited marked dose-limiting hepatotoxicity in murine models', 'high']
    );
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s2.id, workspace.id, user.id, 'Serum ALT and AST escalated to >320 U/L (7-fold baseline elevation) within 6 hours post-injection.', 'statistic', 'acute ALT/AST surges exceeding 320 U/L within 6 hours post-infusion', 'high']
    );
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s2.id, workspace.id, user.id, 'The administration route utilized rapid bolus tail-vein injection rather than slow intravenous titration.', 'methodology', 'Rapid bolus tail-vein administration of 0.3 mg/kg mRNA resulted in acute ALT/AST surges', 'high']
    );

    // 5. Create Source 3
    const s3Res = await db.query(
      `INSERT INTO sources (workspace_id, user_id, title, authors, publication_year, source_type, original_filename, raw_content, word_count, ai_summary, methodology_notes, rigor_score, rigor_justification, key_topics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspace.id,
        user.id,
        'Comparative Biodistribution and Biodegradability of Ester-Linked Ionizable Lipids',
        'Lindqvist, H., Alvarez, G., & Dupont, M.',
        2024,
        'peer_reviewed_paper',
        'lindqvist_2024_ester_lipids.pdf',
        'The persistence of hydrophobic lipid degradation intermediates in the liver parenchyma is a primary driver of sustained hepatic stress. Here, we engineered chemically cleavable ester linkages into the hydrophobic hydrocarbon chains of ionizable lipids with pKa 6.35. In Cynomolgus macaques infused over 30 minutes at 0.5 mg/kg, the ester-cleavable lipids demonstrated an ultra-short intracellular half-life (t1/2 = 8.4 hours), yielding a 78% acceleration in systemic clearance compared to conventional lipids. High reporter protein translation was preserved (86% relative efficacy), while peak ALT levels never surpassed 38 U/L. Slow infusion mitigated acute immune recognition.',
        108,
        'Identifies that incorporating ester-cleavable linkages into ionizable lipids (pKa 6.35) combined with 30-minute slow infusion allows 78% accelerated hepatic clearance, maintaining 86% translation efficacy with pristine liver panels (<38 U/L ALT).',
        'Advanced non-human primate study (Cynomolgus macaques, n=16) with radio-labeled pharmacokinetic tracking, 30-minute infusion protocol, and serial liver biopsies.',
        92,
        'Gold-standard translational study with primate validation, infusion rate comparison, and direct biopsy histology.',
        JSON.stringify(['Ester Linkage', 'Biodegradability', 'Clearance Kinetics', 'Infusion Protocol', 'Primate Model'])
      ]
    );
    const s3 = s3Res.rows[0];

    // Source 3 Claims
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s3.id, workspace.id, user.id, 'Chemically cleavable ester linkages accelerated intracellular lipid clearance by 78% with a half-life of 8.4 hours.', 'statistic', 'demonstrated an ultra-short intracellular half-life (t1/2 = 8.4 hours), yielding a 78% acceleration in systemic clearance', 'high']
    );
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s3.id, workspace.id, user.id, 'Slow intravenous infusion over 30 minutes eliminated acute Kupffer cell cytokine release seen in rapid bolus delivery.', 'methodology', 'Slow infusion mitigated acute immune recognition', 'high']
    );
    await db.query(
      `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s3.id, workspace.id, user.id, 'Peak ALT levels remained under 38 U/L during therapeutic dosing, confirming lack of acute hepatotoxicity.', 'statistic', 'peak ALT levels never surpassed 38 U/L', 'high']
    );

    // 6. Pre-populated Cross-Source Synthesis Report
    await db.query(
      `INSERT INTO synthesis_reports (workspace_id, user_id, title, synthesis_mode, source_ids, executive_summary, consensus_themes, contradictions, research_gaps, decision_recommendations, overall_evidence_strength)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        workspace.id,
        user.id,
        'Comparative Synthesis: Ionizable Lipid pKa Optimization vs. Acute Hepatotoxicity',
        'contradiction_audit',
        JSON.stringify([s1.id, s2.id, s3.id]),
        'This cross-source synthesis resolves the apparent contradiction between high-efficacy mRNA translation and acute hepatic toxicity across three landmark studies. While Vance et al. and Lindqvist et al. demonstrate that an apparent lipid pKa between 6.35 and 6.4 enables superior endosomal escape with benign liver enzyme levels, Kowalski et al. observed catastrophic ALT surges (>320 U/L) at identical pKa ranges. Methodological deconvolution reveals that the discrepancies stem not from the intrinsic lipid pKa itself, but from administration kinetics (rapid bolus injection vs. slow infusion) and lipid metabolic clearance rates. Formulations incorporating biodegradability linkages administered via controlled infusion completely mitigate cytokine cascades while retaining over 86% translation efficacy.',
        JSON.stringify([
          {
            theme_title: 'Ionizable pKa Window for Endosomal Escape',
            synthesis_statement: 'All three sources concur that the optimal biophysical window for endosomal disruption and cytosolic mRNA delivery lies strictly between pKa 6.2 and 6.5.',
            supporting_source_titles: [s1.title, s2.title, s3.title]
          },
          {
            theme_title: 'Clearance Rate Governs Sustained Parenchymal Stress',
            synthesis_statement: 'Non-degradable lipids accumulate in hepatocyte lysosomes, whereas biodegradable ester-linked variants clear within 12 hours.',
            supporting_source_titles: [s1.title, s3.title]
          }
        ]),
        JSON.stringify([
          {
            topic: 'Hepatic Enzyme Elevation (ALT/AST) Thresholds',
            conflicting_positions: 'Kowalski et al. (2023) reported severe acute ALT surges exceeding 320 U/L at 0.3 mg/kg, whereas Vance et al. (2024) and Lindqvist et al. (2024) observed benign levels (<45 U/L and <38 U/L) even at higher 0.5 mg/kg doses.',
            methodological_reason: 'Kowalski utilized rapid tail-vein bolus administration in mice causing sudden shear stress and unshielded charge shock to Kupffer cells, whereas Vance and Lindqvist utilized controlled infusion protocols and higher-order primate models.',
            sources_involved: [s1.title, s2.title, s3.title]
          }
        ]),
        JSON.stringify([
          {
            gap_title: 'Long-term Chronic Redosing in Primate Models',
            description: 'None of the current studies examined multi-month weekly dosing protocols to detect latent autoimmune anti-PEG responses or subclinical micro-steatosis.',
            suggested_next_study: 'Conduct a 24-week repeat-dose non-human primate study measuring anti-PEG IgM/IgG titers and liver collagen deposition.'
          },
          {
            gap_title: 'Sex-Specific Cytokine Activation Disparities',
            description: 'Kupffer cell reactivity and toll-like receptor 7/8 activation curves were primarily profiled in male cohorts.',
            suggested_next_study: 'Evaluate sex-stratified primary human macrophage cultures challenged with candidate lipid formulations.'
          }
        ]),
        JSON.stringify([
          {
            action_title: 'Adopt Biodegradable Ester-Tail Architecture',
            recommendation: 'Mandate biocleavable ester linkages in ionizable lipid design to guarantee half-life under 12 hours, neutralizing organ accumulation risks.',
            evidence_confidence: 'High',
            risk_if_ignored: 'Risk of cumulative liver microsteatosis and regulatory clinical trial holds under repeated dosing.'
          },
          {
            action_title: 'Enforce Controlled Infusion Rate Protocols',
            recommendation: 'Replace bolus IV administration with a minimum 20-30 minute infusion ramp in preclinical and Phase I protocols.',
            evidence_confidence: 'High',
            risk_if_ignored: 'Acute Kupffer cell activation leading to acute phase cytokine storm and elevated trial dropout rates.'
          }
        ]),
        'Strong Consensus'
      ]
    );

    // 7. Seed Copilot Q&A
    await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        workspace.id,
        user.id,
        'user',
        'Why does Study 2 show severe hepatotoxicity (ALT >320 U/L) while Study 1 and Study 3 report safe liver enzymes?',
        JSON.stringify([]),
        JSON.stringify([])
      ]
    );

    await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        workspace.id,
        user.id,
        'assistant',
        'The discrepancy in liver enzyme elevation between **[Source: Dose-Limiting Hepatotoxicity and Inflammatory Cytokine Release in High-Efficiency LNP Formulations]** and the other two studies (**[Source: Optimization of Ionizable Cationic Lipids for Splenic and Hepatic mRNA Delivery]** and **[Source: Comparative Biodistribution and Biodegradability of Ester-Linked Ionizable Lipids]**) stems from two crucial methodological variables:\n\n1. **Administration Kinetics:** Kowalski et al. administered LNPs via **rapid bolus tail-vein injection** in mice. This creates an immediate peak concentration (`C_max`) that overwhelms liver Kupffer cells, triggering pyroptosis and a 12-fold surge in IL-6/TNF-alpha, driving ALT levels past 320 U/L.\n2. **Infusion Protocols and Clearance Architecture:** In contrast, Lindqvist et al. utilized a **30-minute controlled intravenous infusion** in non-human primates and incorporated **ester-cleavable lipid tails** with an 8.4-hour half-life. This prevented sudden charge shock and accelerated metabolic clearance by 78%, keeping ALT levels strictly below 38 U/L.\n\nIn conclusion, the toxicity reported in Study 2 is an artifact of bolus injection kinetics rather than an intrinsic failure of ionizable lipids within the 6.2–6.5 pKa window.',
        JSON.stringify([
          {
            source_id: s2.id,
            source_title: s2.title,
            relevance_note: 'Documents acute ALT surges exceeding 320 U/L via rapid bolus tail-vein injection.',
            key_excerpt: 'Rapid bolus tail-vein administration of 0.3 mg/kg mRNA resulted in acute ALT/AST surges exceeding 320 U/L within 6 hours post-infusion.'
          },
          {
            source_id: s3.id,
            source_title: s3.title,
            relevance_note: 'Demonstrates benign ALT (<38 U/L) achieved via 30-minute slow infusion and ester cleavability.',
            key_excerpt: 'In Cynomolgus macaques infused over 30 minutes at 0.5 mg/kg, peak ALT levels never surpassed 38 U/L.'
          }
        ]),
        JSON.stringify([
          'What are the molecular mechanisms driving Kupffer cell pyroptosis in bolus administration?',
          'How does the 8.4-hour half-life of ester-linked lipids compare to standard MC3 or ALC-0315 lipids?',
          'What clinical infusion protocols are recommended for Phase I human trials based on these findings?'
        ])
      ]
    );

    console.log('[ScholarMesh DB] Demo data seeded successfully!');
    return user;
  } catch (error) {
    console.error('[ScholarMesh DB] Seeding error:', error);
  }
}

export default seedDemoData;

