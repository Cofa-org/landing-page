import React from "react";
import "./blog.css";
const BlogSection = () => {
  // Blog post content paragraphs
  const blogParagraphs = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac efficitur nunc. Suspendisse potenti. Cras pharetra, justo sed tincidunt pulvinar, sapien purus lacinia purus, sit amet luctus augue dolor at nisl. Vivamus semper enim nec bibendum porttitor. Aenean vel velit non nunc lacinia bibendum. Proin imperdiet arcu vel vestibulum condimentum. Etiam non libero nec ipsum ornare fermentum. Integer mattis lorem id cursus dictum.",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer aliquam sapien non dictum pretium. Suspendisse dignissim, quam ut sodales blandit, nulla sapien faucibus neque, at tempus neque leo sit amet libero. Mauris dapibus libero velit, nec luctus elit tristique sed. Duis imperdiet dapibus odio, et viverra ipsum placerat sed. Nulla facilisi. Suspendisse potenti. Phasellus pulvinar est sed porttitor viverra.",
    "Etiam vitae mauris sit amet tortor finibus dictum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur vel est bibendum, feugiat sem nec, elementum erat. Sed posuere, mi at scelerisque consequat, libero neque feugiat magna, nec imperdiet arcu ante et turpis. Integer scelerisque mattis eros nec suscipit. Nam viverra sagittis tortor vitae pharetra. Aliquam scelerisque sapien vitae vestibulum facilisis. Suspendisse sed varius lacus.",
    "Nullam ac bibendum risus, a tincidunt massa. Suspendisse blandit posuere sem, eget luctus nunc rutrum et. Aliquam erat volutpat. Nam id metus felis. Mauris vulputate, nibh sit amet fermentum iaculis, nisi neque lacinia purus, eget pulvinar odio erat vitae ex. Curabitur hendrerit risus nec tortor convallis facilisis. Nam tincidunt ante ut quam bibendum laoreet.",
    "Sed scelerisque erat a nisl rutrum, ut tempus justo volutpat. Mauris efficitur facilisis ultricies. Sed nec est ac risus viverra malesuada. In ut magna vitae neque facilisis ultricies in ac risus. Curabitur a tincidunt sapien. Cras iaculis, leo vitae accumsan condimentum, magna nulla facilisis orci, id vulputate nulla magna ut augue. Integer vehicula lacus ac turpis congue, sed varius quam maximus.",
    "Fusce nec arcu ac libero convallis scelerisque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse potenti. Donec lobortis, nisl eu tincidunt posuere, orci ex suscipit diam, in sagittis justo nulla non diam. Vestibulum vel justo sed tellus fermentum volutpat sed nec augue. Sed id urna sit amet diam efficitur commodo et nec libero.",
    "Nam lacinia, leo a sagittis egestas, nunc augue porttitor lectus, vitae dictum velit tellus sed odio. Mauris fringilla, elit in mattis efficitur, velit est tristique ex, nec malesuada turpis justo vitae dolor. Pellentesque malesuada urna sit amet lacus pretium, nec commodo neque pretium. Phasellus efficitur purus elit, ut maximus est porta a. Nullam bibendum tellus ac ex faucibus, id feugiat velit pulvinar.",
  ];

  // Pagination dots data
  const paginationDots = [
    { className: "blog-dot blog-dot-1" },
    { className: "blog-dot blog-dot-2" },
    { className: "blog-dot blog-dot-3" },
  ];

  return (
    <section className='blog-section'>
      <div className='blog-container'>
        <div className='blog-content'>
          <h2 className='blog-title'>Blog</h2>

          <div className='blog-main'>
            <div className='blog-article'>
              <div className='card blog-card card-shadow'>
                <div className='blog-card-content'>
                  <h3 className='blog-card-title'>Título</h3>
                </div>
              </div>

              <div className='blog-text'>
                {blogParagraphs.map((paragraph, index) => (
                  <React.Fragment key={index}>
                    {paragraph}
                    {index < blogParagraphs.length - 1 && (
                      <>
                        <br /> <br />
                      </>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className='blog-pagination'>
            {paginationDots.map((dot, index) => (
              <div
                key={index}
                className={dot.className}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
