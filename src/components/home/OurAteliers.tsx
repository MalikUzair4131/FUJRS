import Link from "next/link";

const ateliers = [
  {
    initials: "B&A",
    name: "Bridal Atelier",
    description:
      "Hand-finished bridal and festive wear, built around heavy zardozi, dabka, and tilla embroidery.",
    href: "/women",
    swatches: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBes5KrUkrlavVhbDo8JqCBSGesnR8YEEzoFc0RFyRqogpYc41FZ6vyHB78vVxSgFRdcKG0ayXDDTtAVGdg89rv0GvPinGN2uBElpum344QYh3zARgHTUJVgqV15zsrUn25ObKhWcHAY4L684VSVg5nVc0S5MVO0IUYpXaARo8w63JYG_fzsgxkSBqOAgPTaOM1SSLKSxfl2ghp3PdiykI5UzQoiwnSxF1eRAhvi7Ws-3HcEpTuzSXSzgoEym1o11db0lyoF8OAP8I",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB70TdzQhnizT-U40D5BiwBOktGCSNTAjprnC54EegtufPNjWiOk7_G3A6urNwIljnCNhq3heeqC4WTYkwqIlurZG6EX-Zl69WADd2_tPSnSJEjlbrfBjlybHMjNeCNxvSfRKmfdhvtKFMKi_kN2NgKBXQ-HJS3RANX563cNmfmeiMQMMAc42tj9z7b1evrrHhY6fuaMcySN74sIY5PlIfTqNLWEK4vjpzEemxzY7JDu8FRjgXCAPuGn0ABUwixAtf-6ZH4HjSX_u0",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCrSnlFYAgY5LSpb073eF96eDADR-yiuu4Xyrag139Im4Lkes43RkW4OdsR73eIXiB9YGrqgjnZrrU65NX6Udsqn7WPRiRHBDH0kBSNhc1o5g5hv7ljHouTQsDXxa-YmKx1IgXsU1ZjLVvwGukBYG9HEDjNhtYh7aSf8qv0uoB8MmivDFpfd1nqzFpBZD6VjWWRZ7y_3gCWMSR4g_Uh8vq-tT9LHEcU92aQEwZdDpzybeO34H7QZWBfUyiuN7qydqUfCt9mIy9jcB4",
    ],
  },
  {
    initials: "P&S",
    name: "Prêt Studio",
    description: "Everyday lawn and formal unstitched sets for the modern Pakistani woman.",
    href: "/women",
    swatches: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAvzUwA_Oz8-4Fu8dBvhnDe66_2Q88PE7EmOSMTAwldfJKs9hRMpvfSDVZeSUOPMzcqT2FpGXVMclcJQyb3Q2OmVP7cBIBDenKl22R3r3-iEsalHRCJ_8HOotpLXkd7xb4bXrr9ohe1hxcBkdYynWbjuDxjyv-uG0SFWKJ1Wj5IViFYY6l_RmbfKWGpeRNz94U3z4rSsBiqfYO5aTu7fgw8JMVP-mSKQZ0GgaecP6I-Dp-vPJynGCf5iGxQb9FUBgTWdUZnWUKrsl8",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxlcrgJKQjK0XrUQFDuN79WEiEilslZIbqDiZ7wQDzQWIIhHks4UZbDQ_vv-U0EiIANCVOcz215Efzj3wcEwG-7W78Tw9Sjpv10YLVLis6SpSCykdY0OTqBwkc54uSY5OBoPWu4S4ZdVOJLNhAqtDRnXoJzL4d8x-pBQqtQufr_d0d5Tg-77cMvmUWNsKs_7ENNFk8VgiIkgqNOt0W4zTeHST5NbrBqv6mALpi7N2PTPi4YdgmG0S3QJcxxqbI_PMoe2Pj_w8-vNE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCArME01QAiw2bgEre3DszNbLKlbxbkreAnbJ5b7FEUi6cVC-e5Uz8RCxddBI-Dm7gZvbQmfbouSbYqLgV76-w3QKNMZ5M5nwRT1FSkmUJn_-3cnSd-5Bazx10MGUu9YoEI_wNf3E0Oop7HDmawkw8IptGXulhSKov8bg9hulKoiFdJLxbrWo1SruPip2S7yeHtz2g4sjsx6coqPaFzV4bS0oTExFcPRsAOSz6LR7Jpro_gOvjnjtmzrmw35X_4ZxIMCBFb97LBVUA",
    ],
  },
  {
    initials: "M&G",
    name: "Menswear Guild",
    description:
      "Precision tailoring and heritage fabrics for the contemporary gentleman's wardrobe.",
    href: "/men",
    swatches: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBu_U4uvPnB8fiD1pbHIuNZ-vT14y85bQiO5KRJhuahYIonfNvoXy_6iBuZDdtqu40yfzCEjH_X9QSO9JALDmKuejHQM3Qgj8iSGKasjTqkJ7dRkmvsofkTYqtV6qFLu_3IjiMNZySQqtskUeaEj_2DDJ1xdAGAsFsT4odd7gQny8E5HcB-_ktQZmQp14fGJg9ZCtvpaWht2kogdDaa5sA6tPB_0YhFBt7cfXO0W3WPfaM08PXeqsyQvl9Tr6bbCwRWeogXStCFves",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAmDx58S7dLvWcamiofoFx6NGSell1X_yOZXIVJ77mUDHmKAhFQNuJVXnXUfWZYm4DS8u7SGMDqyO821cnZcHFT5x8VJHdIGy8xh-nddi7qwfeusS7iVLJp_Q0iK_vUSOnmrh8136Qdni398as4c3dIOmzukyRKoYXLZuiLdpflWdGhBrzyF0DmyHZtD-TI7PdJWKxOQNZ_Q7DxKo-N72efXOTVYIxJF5v8OzPHWFqA0lLPXMWnYL9pjfw7cYmF-fv9KZMb8lzE_UE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBYFa6pULJl7c8YkiN0rje5Kb-1Id0Ydk7NZrn_YJz1wudc3VJIC27PfWtnzoNbyQkOfMMyT0Bf-lEYFmv_j-j8FA99PCpXjwxfdaTuz1vUF4iRLRIezSgjQ4lBOcPDkzhQ7EJXRYQ6_Lu9ts5zJM6kyHgs4Aav_4uvN_oMslVz3oWvnz_TyHcIcg9R14pzC-7mwwLXb1Gn0M0JVOSap1uqca1Csv2yw75bFHrCTxz22Lxpm7iDj-DTv01aGfJZ4a0ySuN6iUmnTDo",
    ],
  },
];

export function OurAteliers() {
  return (
    <section className="py-margin-desktop bg-surface">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="text-center mb-16">
          <h2 className="font-headline-md text-headline-md mb-4">Our Ateliers</h2>
          <p className="text-on-surface-variant font-body-md uppercase tracking-widest text-[13px]">
            In-house specialists. Unmatched quality.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {ateliers.map((atelier) => (
            <div
              key={atelier.name}
              className="border border-outline-variant p-8 group hover:bg-white transition-all duration-500 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 overflow-hidden bg-surface-container rounded-full border border-outline-variant flex items-center justify-center">
                <span className="font-display-lg text-headline-sm">{atelier.initials}</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <h3 className="font-headline-sm text-headline-sm">{atelier.name}</h3>
                <span
                  className="material-symbols-outlined text-[16px] text-marketplace-bronze"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <p className="text-on-surface-variant font-body-md mb-8 line-clamp-2">
                {atelier.description}
              </p>
              <div className="flex justify-center gap-2 mb-10">
                {atelier.swatches.map((swatch, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-surface-container bg-cover bg-center"
                    style={{ backgroundImage: `url('${swatch}')` }}
                    role="img"
                    aria-label={`${atelier.name} fabric swatch ${i + 1}`}
                  />
                ))}
              </div>
              <Link
                href={atelier.href}
                className="font-label-md text-label-sm uppercase border-b border-primary pb-1"
              >
                Explore Collection
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
