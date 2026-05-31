"use client"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/src/components/ui/carousel";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";

const reviews = [
  {
    id: 1,
    rating: 5,
    comment:
    "Thank you to everyone at Davut Travel for such a pleasant tour 🩷🩷 I want to visit many more beautiful corners of Georgia with you, you are the best",
  },
  {
    id: 2,
    rating: 4,
    comment:
      "رحلة ممتازة والسائق عمر يمتاز باللغه العربيه وممتع للغايه",
  },
  {
    id: 3,
    rating: 5,
    comment:
      "Mashallah, their service is very upscale, beautiful places, and in addition to that, good manners, may God grant them success.",
  },
  {
    id: 4,
    rating: 5,
    comment:
      "داوود تعاملت معه شخص محترم واذا هو مشغول يرسل عليك سايق محترم ولا يقصر ب اي حاجه تبيها ، من واقع تجربه انصحكم فيه وبالسعر سمح ولا يقصر . اشكرك اخ داوود",
  },
  {
    id: 5,
    rating: 4,
    comment:
      "شركة رائعة جدا.  والأهم من ذلك أن لديهم سائقين مسلمين",
  },
  {
    id: 6,
    rating: 5,
    comment:
    "فريق متعاون وممتاز ويساعدك في إيجاد أنسب الأسعار ويأخذك الى اماكن جميلة وممتعه للتنزه",
  }
];

const ReviewsSection = () => {
  const t = useTranslations("main");

  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: 0.5,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <section className="md:pt-12 md:pb-20 pb-12 flex w-full flex-col items-center">
      <motion.h1 
        className="text-2xl md:text-3xl text-center mb-5 md:mb-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={buttonVariants}
      >
        {t("guestReviews")}
      </motion.h1>
      <Carousel
        opts={{
          align: "start",
        }}
        className="mt-6 w-full p-0"
      >
        <CarouselContent className="gap-2 md:gap-4 mx-4 md:mx-20">
          {reviews.map((item, index) => (
            <CarouselItem
              key={index}
              className="w-full rounded-xl border border-brand-green-100 bg-brand-green-50 md:basis-1/2 lg:basis-1/3"
            >
              <div className="flex h-full flex-col justify-between p-6">
                <div>
                  <div className="mb-4 flex items-center">
                    {[...Array(item.rating)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="md:mb-4 mb-2 text-xs md:text-sm text-gray-600">{item.comment}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block md:absolute -top-20 md:right-20 lg:right-40">
          <CarouselPrevious className="bg-brand-green text-brand-cream w-10 h-10 border-brand-green-mid rounded-md border hover:bg-brand-green-dark hover:text-brand-cream" />
          <CarouselNext className="bg-brand-green text-brand-cream w-10 h-10 border-brand-green-mid rounded-md border hover:bg-brand-green-dark hover:text-brand-cream" />
        </div>
      </Carousel>
      <motion.div
        className="mt-8 md:mt-12"
        variants={buttonVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.a
          href="https://www.google.com/search?sca_esv=d4edb64137185dc1&sxsrf=AHTn8zo8yG3ZwVptYkI6sZdurKxl48Wwdw:1742539019683&q=daud+travel+%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98+reviews&uds=ABqPDvydOnXLIQe0uw2erhJOuCd2wByMFsBguJZ_jN2uNeYYcm5CdFEWUH_0jdy0OQKrsjv9asdSE6lWR6qZulYvnMuroBgheWZ_HZW4kE2U-2O7SeB4FOQHyIUYiAYUMvDCJYdsR7YCSGGGJc5FN0_XJ9tABGjOn5ICTpzrX_X5i9cexbRIKLEGhHe-COt7iSiA2N_YUpK2mq17n3jRVgDd3PkMR8ZiiItCZRKkCmhsFS0OXMxfiMyCz4VGQbpCNbio8timQNZLuxWtdKa89huHee6dQrcFSaz-dJfYdfQthKhAuPyLYEOsxIQEDlcMBJm2N2CLoGlG-Wvbyxop12vC0qKmaQWCkw2ZFvYSUgOvLsSA2JPr2UzAVfrarPBaECDBAWrzDGb7lSNzMEIpwF664lYcCfgEnS20JmXE0sobLCOq6DlETLHqHAoZVMRbGeTr7i1tpHGdOXKzpW-CGKlV83-L8CJkLhtiFHfq2LGM1u0Z9mXGn9X3j5oZEcMQbjcJzdRAwwhK1wYoRedqupKOpRwgKCaXiQ&si=APYL9bs7Hg2KMLB-4tSoTdxuOx8BdRvHbByC_AuVpNyh0x2KzfHyCBwvh3e4KvH3dACl5gud_1R1x9yqD8v01ztTh1wYsIxoBXCcsUuxqhcMJ4SJyU_BHU89dmKOnyaaYIPXqnhsktVT6K_aDS_7vvOxniOp_qXomA%3D%3D&sa=X&ved=2ahUKEwjS35nax5qMAxWqU6QEHXJXJB0Qk8gLegQIHBAB&ictx=1&biw=411&bih=785&dpr=2.63#ebo=2"
          target="_blank"
          rel="noopener noreferrer"
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
        >
          <Button className="bg-brand-green hover:bg-brand-green-dark text-brand-cream px-6 py-2 text-sm md:text-base rounded-md transition-all duration-300">
            {t("viewAllReviews")}
          </Button>
        </motion.a>
      </motion.div>
    </section>
  );
};

export default ReviewsSection;