import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";

const ShareDialog = ({ url }: { url: string }) => {
  return (
    <div className="grid grid-cols-3 place-items-center gap-8 p-4">
      <WhatsappShareButton url={url}>
        <WhatsappIcon round size={48} />
      </WhatsappShareButton>

      <FacebookShareButton url={url}>
        <FacebookIcon round size={48} />
      </FacebookShareButton>

      <TelegramShareButton url={url}>
        <TelegramIcon round size={48} />
      </TelegramShareButton>

      <TwitterShareButton url={url}>
        <TwitterIcon round size={48} />
      </TwitterShareButton>

      <RedditShareButton url={url}>
        <RedditIcon round size={48} />
      </RedditShareButton>

      <EmailShareButton url={url}>
        <EmailIcon round size={48} />
      </EmailShareButton>
    </div>
  );
};

export default ShareDialog;
