#!/usr/bin/perl

open(VOICEMAIL,"|/usr/sbin/sendmail -t");
#open(VOICEMAIL,"|ssh jha\@slice.washucsc.org 'cat > emailmessage.txt'");
open(LAMEDEC,"|/usr/bin/dos2unix|/usr/bin/base64 -id| /usr/bin/sox -t wav - -e signed-integer -t wav - |  /usr/bin/lame --quiet --preset voice - /var/spool/asterisk/tmp/vmout.$$.mp3");
$c = `date +'%F--%T'`;
chomp $c;
$c = "/var/spool/asterisk/emailed_vm/$c";
open(VM,"| cat > $c.txt");
my $inaudio = 0;
loop: while(<>){
  if(/^\.$/){
    last loop;
  }
  if(/^Content-Type: audio\/x-wav/i){
    $inaudio = 1;
  }
  if($inaudio){
    while(s/^(Content-.*)wav(.*)$/$1mp3$2/gi){}
    if(/^\n$/){
      iloop: while(<>){
        print LAMEDEC $_;
        if(/^\n$/){
          last iloop;
        }
      }
      close(LAMEDEC);
      system("cp /var/spool/asterisk/tmp/vmout.$$.mp3 $c.mp3");
      print VOICEMAIL "\n";
      print VM "\n";
      open(B64,"/usr/bin/base64 /var/spool/asterisk/tmp/vmout.$$.mp3|");
      while(<B64>){
        print VOICEMAIL $_; 
	print VM $_;	
      }
      close(B64);
      print VOICEMAIL "\n";
      print VM "\n";
      $inaudio = 0;
    }
  }
  print VOICEMAIL $_;
  print VM $_;
}
print VOICEMAIL "\.";
print VM "\.";
close(VOICEMAIL);
close(VM);
